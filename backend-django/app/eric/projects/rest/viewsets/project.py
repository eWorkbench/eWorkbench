#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.db.models import Q
from django.utils.translation import gettext_lazy as _
from django_changeset.models import ChangeSet
from django_userforeignkey.request import get_current_user
from rest_framework.decorators import action
from rest_framework.response import Response

from eric.core.rest.viewsets import BaseAuthenticatedModelViewSet, BaseAuthenticatedReadOnlyModelViewSet, \
    DeletableViewSetMixIn
from eric.projects.models import Project
from eric.projects.rest.filters import ProjectFilter
from eric.projects.rest.serializers import PublicUserSerializer, ProjectBreadcrumbSerializer, \
    ProjectSerializerExtended
from eric.projects.rest.viewsets import ChangeSetViewSet
from eric.shared_elements.models import CalendarAccess


class ProjectUsersViewSet(BaseAuthenticatedReadOnlyModelViewSet):
    serializer_class = PublicUserSerializer

    search_fields = ('username', 'email', 'first_name', 'last_name',)
    pagination_class = None

    def get_queryset(self):
        if 'project_pk' in self.kwargs:
            return Project.objects.viewable().filter(
                pk=self.kwargs['project_pk']).first().assigned_users.select_related('userprofile')


class ProjectBreadcrumbViewSet(BaseAuthenticatedReadOnlyModelViewSet):
    serializer_class = ProjectBreadcrumbSerializer

    filter_backends = ()
    search_fields = ()
    pagination_class = None

    def get_queryset(self):
        if 'project_pk' in self.kwargs:
            project = Project.objects.viewable().filter(pk=self.kwargs['project_pk']).first()

            if not project:
                return Project.objects.none()

            return project.get_breadcrumb_queryset(include_self=True)

        return Project.objects.none()


class ProjectViewSet(BaseAuthenticatedModelViewSet, DeletableViewSetMixIn):
    """ Handles projects. """

    serializer_class = ProjectSerializerExtended
    filterset_class = ProjectFilter
    search_fields = ('name', 'description',)
    ordering_fields = ['pk', 'name', 'start_date', 'stop_date']

    @action(detail=True, methods=['POST'])
    def duplicate(self, request, format=None, *args, **kwargs):
        """
        Duplicates the project with all its sub-projects. The duplicated instance will not have a parent project.
        """

        project_object = Project.objects.viewable().get(pk=kwargs['pk'])
        original_project_pk = project_object.pk
        duplicate_metadata = request.data.get('duplicate_metadata', False)

        # duplicates the project
        # change name to "Copy of" + project name
        # the duplicated project can not be a sub project so set parent_project_id to NONE if it was set
        duplicated_project = project_object.duplicate(
            name=_("Copy of") + f" {project_object.name}",
            parent_project_id=None,
            metadata=project_object.metadata.all() if duplicate_metadata else None,
        )

        dict_duplicated_project_pk = dict()
        dict_duplicated_project_pk[original_project_pk] = duplicated_project.pk

        # duplicate all tasks assigned to the project
        from eric.shared_elements.models import Task
        tasks = Task.objects.viewable().filter(projects__in=[original_project_pk])
        if tasks:
            for task in tasks:
                duplicated_task = task.duplicate(projects=[duplicated_project])
                if duplicate_metadata:
                    duplicated_task.metadata.set(task.metadata.all())

        # duplicate sub projects
        Project.duplicate_sub_projects(dict_duplicated_project_pk, duplicate_metadata)

        serializer = self.get_serializer(duplicated_project)

        return Response(serializer.data)

    def get_queryset(self):
        return Project.objects.viewable().prefetch_common()


class ProjectChangeSetViewSet(ChangeSetViewSet):
    """ ViewSet for generic changes on all project related models"""

    def get_queryset(self):
        user = get_current_user()

        if user.is_anonymous:
            return ChangeSet.objects.none()

        project_pk = self.kwargs.get('project_pk', None)
        if not project_pk:
            return ChangeSet.objects.none()

        project_ids = Project.objects.filter(pk=project_pk).first().get_descendants(include_self=True)\
            .values_list('pk', flat=True)

        # build a conditions list, where we will add more conditions with "OR"
        conditions = Q()

        # get all relevant search models
        workbench_models = self.get_models_based_on_request(self.request)

        # iterate over search models
        for model in workbench_models:
            if model == Project:
                # special case for projects
                object_ids = project_ids
            elif model == CalendarAccess:
                # special case for CalendarAccess: it has no projects, so we can pass here
                object_ids = []
            else:
                object_ids = model.objects.viewable().for_project(
                    project_pk,
                    prefetched_project_ids=project_ids
                )

            # add conditions to existing conditions with OR
            conditions = conditions | Q(
                object_type=model.get_content_type(),
                object_uuid__in=object_ids
            )

        # query changesets with above conditions
        return ChangeSet.objects.filter(
            conditions
        ).order_by(
            '-date'
        ).select_related(
            'user', 'user__userprofile', 'object_type'
        ).prefetch_related(
            'change_records'
        )
