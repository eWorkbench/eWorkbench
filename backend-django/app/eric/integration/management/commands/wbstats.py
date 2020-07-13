#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import statistics
from abc import ABC, abstractmethod
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db.models import Q, Max, Count, Avg, Min
from django.test import RequestFactory
from django_changeset.models import ChangeSet, logging
from django_userforeignkey.request import set_current_request

from eric.labbooks.models import LabBookChildElement
from eric.model_privileges.models import ModelPrivilege
from eric.projects.models import ContentType, Project
from eric.relations.models import Relation
from eric.shared_elements.models import File

User = get_user_model()

PERFORMANCE_LOGGER = logging.getLogger('eric.performance')


def log(group, model, key, value, comment=''):
    if model:
        app_label = model._meta.app_label
        model_name = model.__name__
    else:
        app_label = '-'
        model_name = '-'

    log_simple(group, model_name, app_label, key, value, comment)


def log_simple(group, model, app, key, value, comment=''):
    try:
        # insert thousands separators
        value = '{:,}'.format(value)
    except ValueError:
        pass

    print(f'{group}\t{model} <{app}>\t{key}\t{value}\t{comment}')


class Command(BaseCommand):
    help = 'Prints various usage metrics'

    def handle(self, *args, **options):
        log_simple('GROUP', 'MODEL', 'APP', 'KEY', 'VALUE', 'COMMENT')

        analysis_classes = [
            ModelCountAnalysis(),
            RelationAnalysis(),
            LabBookElementAnalysis(),
            InteractionAnalysis(),
            ProjectHierarchyAnalysis(),
            ProjectMemberAnalysis(),
            PrivilegeAnalysis(),
            # commented-out for now, since the permission system is too slow
            # ElementVisibilityAnalysis(),
        ]

        for analysis_class in analysis_classes:
            analysis_class.analyse()


class AbstractAnalysis(ABC):
    """ Abstract base class for concrete analysis classes """

    ALL_MODELS = [
        ct.model_class() for ct in ContentType.objects.all() if ct.model_class()
    ]
    ALL_MODELS.sort(key=lambda m: m.__name__)
    MODELS_WITH_RELATIONS = [
        model for model in ALL_MODELS
        if hasattr(model._meta, 'is_relatable') and model._meta.is_relatable
    ]
    MODELS_WITH_PRIVILEGES = [
        model for model in ALL_MODELS
        if hasattr(model._meta, 'can_have_special_permissions') and model._meta.can_have_special_permissions
    ]
    ALL_USERS = User.objects.all()
    USERS_THAT_HAVE_LOGGED_IN = ALL_USERS.filter(last_login__isnull=False)

    # needs to be defined by subclasses:
    group = None

    @abstractmethod
    def analyse(self):
        pass

    @staticmethod
    def median_value(queryset, term):
        count = queryset.count()
        values = queryset.values_list(term, flat=True).order_by(term)
        if count % 2 == 1:
            # uneven count => use middle element
            return values[int(round(count / 2))]
        else:
            # even count => use average of the two middle elements
            mid = count / 2
            return sum(values[mid - 1:mid + 1]) / Decimal(2.0)

    @classmethod
    def metrics(cls, queryset, count_field):
        # add count to query
        queryset = queryset.annotate(**{
            'annotated_count': Count(count_field)
        })

        # overwrite default ordering, so GROUP BY and ORDER BY can match in SQL
        queryset = queryset.order_by(count_field)

        min = queryset.aggregate(Min('annotated_count'))['annotated_count__min']
        median = cls.median_value(queryset, 'annotated_count')
        average = round(queryset.aggregate(Avg('annotated_count'))['annotated_count__avg'])
        max = queryset.aggregate(Max('annotated_count'))['annotated_count__max']

        return min, median, average, max

    @classmethod
    def metrics_by_m2m(cls, queryset, count_field):
        """ Metrics by counting a many-to-many field """
        return cls.metrics(queryset, count_field)

    @classmethod
    def metrics_by_fk(cls, queryset, count_field):
        """ Metrics by counting a foreign-key field """

        # limit SELECT clause to the count_field, so GROUP BY can be reduced to the count_field
        queryset = queryset.values(count_field)
        return cls.metrics(queryset, count_field)

    def log(self, model, key, value, comment=''):
        return log(self.group, model, key, value, comment)

    def log_simple(self, model, app, key, value, comment=''):
        return log_simple(self.group, model, app, key, value, comment)

    @staticmethod
    def fake_request_user(user):
        request = RequestFactory().request(**{})
        setattr(request, 'user', user)
        set_current_request(request)


class ModelCountAnalysis(AbstractAnalysis):
    """ Simple model object counts """
    group = 'Model Counts'

    def analyse(self):
        for model in self.ALL_MODELS:
            self.log(model, 'Total objects', model.objects.all().count())

        # non-WebDAV files
        self.log(File, 'Objects without directory', File.objects.filter(directory__isnull=True).count())


class RelationAnalysis(AbstractAnalysis):
    """ Relations from and to models """

    group = 'Relations'

    def analyse(self):
        for model in self.MODELS_WITH_RELATIONS:
            ct = ContentType.objects.get_for_model(model)
            relations_left = Relation.objects.filter(left_content_type=ct)
            relations_right = Relation.objects.filter(right_content_type=ct)
            relations = Relation.objects.filter(Q(right_content_type=ct) | Q(left_content_type=ct))
            self.log(model, 'Relations for model', relations.count())
            # relation: left=target, right=base model
            self.log(model, 'Relations for model | From', relations_right.count())
            self.log(model, 'Relations for model | To', relations_left.count())
            self.log(model, 'Relations for model | Private', relations.filter(private=True).count())


class LabBookElementAnalysis(AbstractAnalysis):
    """ Count of models in LabBooks """

    group = "LabBook Elements"

    def analyse(self):
        for model in self.ALL_MODELS:
            ct = ContentType.objects.get_for_model(model)
            in_labbook = LabBookChildElement.objects.filter(child_object_content_type=ct)
            in_labbook_count = in_labbook.count()
            if in_labbook_count > 0:
                self.log(model, 'In LabBook', in_labbook_count)

            in_section = in_labbook.exclude(labbooksection=None).distinct()
            in_section_count = in_section.count()
            if in_section_count > 0:
                self.log(model, 'In LabBook section', in_section_count)


class InteractionAnalysis(AbstractAnalysis):
    """ Interactions (ChangeRecords / ChangeSets) """

    group = "Interactions"

    def analyse(self):
        self.log(User, 'Users', self.ALL_USERS.count())
        self.log(User, 'Users that have logged in', self.USERS_THAT_HAVE_LOGGED_IN.count())

        actual_users = self.ALL_USERS.filter(last_login__isnull=False)
        minimum, median, average, maximum = self.metrics(actual_users, count_field='all_changes')
        self.log(ChangeSet, 'Interactions per user (that has logged in) | min', minimum)
        self.log(ChangeSet, 'Interactions per user (that has logged in) | median', median)
        self.log(ChangeSet, 'Interactions per user (that has logged in) | avg', average)
        self.log(ChangeSet, 'Interactions per user (that has logged in) | max', maximum)

        qs = ChangeSet.objects.all().values('object_uuid').order_by('object_uuid')
        minimum, median, average, maximum = self.metrics(qs, count_field='object_uuid')
        self.log(ChangeSet, 'Interactions per element | min', minimum)
        self.log(ChangeSet, 'Interactions per element | median', median)
        self.log(ChangeSet, 'Interactions per element | avg', average)
        self.log(ChangeSet, 'Interactions per element | max', maximum)


class ProjectHierarchyAnalysis(AbstractAnalysis):
    """ Sub-Project hierarchy """

    group = "Project Hierarchy"

    def analyse(self):
        all_projects = Project.objects.all()
        minimum, median, average, maximum = self.metrics(all_projects, count_field='sub_projects')
        self.log(Project, 'Subprojects of all projects | min', minimum)
        self.log(Project, 'Subprojects of all projects | median', median)
        self.log(Project, 'Subprojects of all projects | avg', average)
        self.log(Project, 'Subprojects of all projects | max', maximum)

        root_projects = all_projects.filter(parent_project__isnull=True)
        minimum, median, average, maximum = self.metrics(root_projects, count_field='sub_projects')
        self.log(Project, 'Subprojects of root projects | min', minimum)
        self.log(Project, 'Subprojects of root projects | median', median)
        self.log(Project, 'Subprojects of root projects | avg', average)
        self.log(Project, 'Subprojects of root projects | max', maximum)

        sub_projects = all_projects.filter(parent_project__isnull=False)
        minimum, median, average, maximum = self.metrics(sub_projects, count_field='sub_projects')
        self.log(Project, 'Subprojects of subprojects | min', minimum)
        self.log(Project, 'Subprojects of subprojects | median', median)
        self.log(Project, 'Subprojects of subprojects | avg', average)
        self.log(Project, 'Subprojects of subprojects | max', maximum)


class ProjectMemberAnalysis(AbstractAnalysis):
    group = "Project Members"

    def analyse(self):
        minimum, median, average, maximum = self.metrics(
            Project.objects.all(),
            count_field='assigned_users_roles'
        )
        self.log(Project, 'Members per project | min', minimum)
        self.log(Project, 'Members per project | median', median)
        self.log(Project, 'Members per project | avg', average)
        self.log(Project, 'Members per project | max', maximum)


class PrivilegeAnalysis(AbstractAnalysis):
    group = 'Privileges'

    def analyse(self):
        minimum, median, average, maximum = self.metrics(
            self.USERS_THAT_HAVE_LOGGED_IN,
            count_field='model_privileges_new'
        )
        self.log(ModelPrivilege, 'Privileged elements per user | min', minimum)
        self.log(ModelPrivilege, 'Privileged elements per user | median', median)
        self.log(ModelPrivilege, 'Privileged elements per user | avg', average)
        self.log(ModelPrivilege, 'Privileged elements per user | max', maximum)

        for model in self.MODELS_WITH_PRIVILEGES:
            ct = ContentType.objects.get_for_model(model)
            privileges = ModelPrivilege.objects.filter(content_type=ct)
            total = privileges.count()
            if total > 0:
                minimum, median, average, maximum = self.metrics_by_fk(privileges, count_field='object_id')
                self.log(model, 'Privileges for model', total)
                self.log(model, 'Privileges per element | min', minimum)
                self.log(model, 'Privileges per element | median', median)
                self.log(model, 'Privileges per element | avg', average)
                self.log(model, 'Privileges per element | max', maximum)


class ElementVisibilityAnalysis(AbstractAnalysis):
    group = 'Element visibility (viewable per user)'

    def analyse(self):
        for model in self.MODELS_WITH_PRIVILEGES:
            # collect viewable-count for all users
            datapoints = []
            for user in self.USERS_THAT_HAVE_LOGGED_IN:
                self.fake_request_user(user)
                datapoints.append(model.objects.viewable().count())

            # analyse data
            minimum = min(datapoints)
            maximum = max(datapoints)
            average = sum(datapoints) / len(datapoints) if len(datapoints) > 0 else 0
            median = statistics.median(datapoints)
            self.log(model, 'Viewable elements per user | min', minimum)
            self.log(model, 'Viewable elements per user | median', median)
            self.log(model, 'Viewable elements per user | avg', average)
            self.log(model, 'Viewable elements per user | max', maximum)
