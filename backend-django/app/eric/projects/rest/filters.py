#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.contrib.auth import get_user_model
from django.db.models.constants import LOOKUP_SEP

from eric.core.rest.filters import BaseFilter, BooleanDefaultFilter
from eric.core.rest.filters import ListFilter, RecursiveProjectsListFilter, RecentlyModifiedByMeFilter
from eric.projects.models import Project, ProjectRoleUserAssignment, Resource, Role, ResourceBooking

User = get_user_model()


class ProjectRoleUserAssignmentFilter(BaseFilter):
    """ Filter for Project, which allows filtering by project state (choice) """

    class Meta:
        model = ProjectRoleUserAssignment
        fields = {
            'project': BaseFilter.FOREIGNKEY_COMPERATORS,
            'user': BaseFilter.FOREIGNKEY_COMPERATORS,
            'role': BaseFilter.FOREIGNKEY_COMPERATORS,
        }

    project = ListFilter(name='project')
    role = ListFilter(name='role')
    user = ListFilter(name='user')


class ProjectFilter(BaseFilter):
    """ Filter for Project, which allows filtering by project state (choice) """

    class Meta:
        model = Project
        fields = {
            'project_state': BaseFilter.CHOICE_COMPERATORS,
            'parent_project': BaseFilter.FOREIGNKEY_COMPERATORS,
        }

    deleted = BooleanDefaultFilter()

    project_state = ListFilter(name='project_state')

    @property
    def qs(self):
        # get root-projects and sub-projects where the parent is not viewable
        parent_projects_and_orphans = self.request.GET.get('parent_projects_and_orphans', '')
        if parent_projects_and_orphans:
            return Project.objects.viewable_with_orphans().prefetch_common()

        qs = super().qs

        # recursive parent: get all sub-projects, recursively, under the given project
        recursive_parent_pk = self.request.GET.get('recursive_parent', None)
        if recursive_parent_pk:
            recursive_parent = Project.objects.filter(pk=recursive_parent_pk).first()
            if recursive_parent:
                sub_project_pks = [project.pk for project in recursive_parent.all_sub_projects]
                qs = qs.filter(pk__in=sub_project_pks)

        # load parent projects of the given pk only
        parents_of_pk = self.request.GET.get('parents_of', None)
        if parents_of_pk:
            project = Project.objects.filter(pk=parents_of_pk).first()
            qs = qs.filter(pk__in=project.parent_pk_list).exclude(pk=project.pk)

        # pk and name only
        pk_and_name = self.request.GET.get('pk_and_name', None)
        if pk_and_name:
            qs = qs.values('pk', 'name')

        return qs


class UserFilter(BaseFilter):
    """ Filter for User, which allows filtering by username, first_name and last_name """

    class Meta:
        model = User
        fields = {
            'username': BaseFilter.STRING_COMPERATORS,
        }

    username = ListFilter(name='username')


class ResourceFilter(BaseFilter):
    """ Filter for Resource, which allows filtering by type """

    class Meta:
        model = Resource
        fields = {
            'type': BaseFilter.CHOICE_COMPERATORS,
            'projects': BaseFilter.FOREIGNKEY_COMPERATORS,
            'projects_recursive': BaseFilter.FOREIGNKEY_COMPERATORS,
            'created_by': BaseFilter.FOREIGNKEY_COMPERATORS,
        }

    deleted = BooleanDefaultFilter()

    projects = ListFilter(name='projects')

    projects_recursive = RecursiveProjectsListFilter(name='projects')

    recently_modified_by_me = RecentlyModifiedByMeFilter()


class ResourceBookingFilter(BaseFilter):
    """ Filter for ResourceBooking, which allows filtering by type """

    class Meta:
        model = ResourceBooking
        fields = {
            'date_time_start': BaseFilter.DATE_COMPERATORS,
            'date_time_end': BaseFilter.DATE_COMPERATORS,
            'resource': BaseFilter.FOREIGNKEY_COMPERATORS,
            'meeting': BaseFilter.FOREIGNKEY_COMPERATORS,
        }

    recently_modified_by_me = RecentlyModifiedByMeFilter()

    @classmethod
    def get_filter_name(cls, field_name, lookup_expr):
        """
        Combine a field name and lookup expression into a usable filter name.
        Exact lookups are the implicit default, so "exact" is stripped from the
        end of the filter name.
        """
        if field_name == 'date_time_start' or field_name == 'start_date':
            field_name = 'start_date'
        elif field_name == 'date_time_end' or field_name == 'due_date':
            field_name = 'end_date'

        filter_name = LOOKUP_SEP.join([field_name, lookup_expr])

        # This also works with transformed exact lookups, such as 'date__exact'
        _exact = LOOKUP_SEP + 'exact'
        if filter_name.endswith(_exact):
            filter_name = filter_name[:-len(_exact)]

        return filter_name


class MyResourceBookingFilter(BaseFilter):
    """ Filter for ResourceBooking, which allows filtering by type """

    class Meta:
        model = ResourceBooking
        fields = {
            'date_time_start': BaseFilter.DATE_COMPERATORS,
            'date_time_end': BaseFilter.DATE_COMPERATORS,
            'resource': BaseFilter.FOREIGNKEY_COMPERATORS,
            'meeting': BaseFilter.FOREIGNKEY_COMPERATORS,
        }

    recently_modified_by_me = RecentlyModifiedByMeFilter()


class RoleFilter(BaseFilter):
    """ Filter for Role, which allows filtering by permission code name """

    class Meta:
        model = Role
        fields = {
            'permission': BaseFilter.CHOICE_COMPERATORS,
        }

    permission = ListFilter(name='permissions__codename')
