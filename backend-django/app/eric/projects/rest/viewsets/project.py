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
    ProjectSerializerExtended, ProjectTreeSerializer
from eric.projects.rest.viewsets import ChangeSetViewSet, get_object_or_404
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
    """ ViewSet for creating and querying projects;
    on query, only list the projects that an authenticated user is associated to (for now) """
    serializer_class = ProjectSerializerExtended
    filterset_class = ProjectFilter
    search_fields = ()
    ordering_fields = ['pk', 'name', 'start_date', 'stop_date']

    def perform_destroy(self, instance):
        """
        Overwrite the perform_destroy method
        set the projects state to DELETED before we actually delete it
        :param instance:
        :return:
        """
        super(ProjectViewSet, self).perform_destroy(instance)

    @action(detail=True, methods=['POST'])
    def duplicate(self, request, format=None, *args, **kwargs):
        """
        Duplicates the project with all it sub projects. When the original project was an sub project the
        duplicate instance has now no parent project anymore.
        """
        project_object = Project.objects.viewable().get(pk=kwargs['pk'])
        original_project_pk = project_object.pk

        # duplicates the project
        # change name to "Copy of" + project name
        # the duplicated project can not be a sub project so set parent_project_id to NONE if it was set
        duplicated_project = project_object.duplicate(name=_("Copy of ") + project_object.name, parent_project_id=None)

        dict_duplicated_project_pk = dict()
        dict_duplicated_project_pk[original_project_pk] = duplicated_project.pk

        # duplicate all tasks assigned to the project
        from eric.shared_elements.models import Task
        tasks = Task.objects.viewable().filter(projects__in=[original_project_pk])
        if tasks:
            for task in tasks:
                task.duplicate(projects=[duplicated_project])

        # duplicate sub projects
        Project.duplicate_sub_projects(dict_duplicated_project_pk)

        serializer = self.get_serializer(duplicated_project)

        return Response(serializer.data)

    def get_queryset(self):
        """ returns the projects of the current user, or, if is_staff is true, all projects """
        # get all viewable projects and prefetch the dmps as well

        return Project.objects.viewable().prefetch_common()


class ProjectChangeSetViewSet(ChangeSetViewSet):
    """ ViewSet for generic changes on all project related models"""

    def get_queryset(self):
        """
        gets a queryset with all changes to the items that the current user has access to
        :return:
        """
        user = get_current_user()

        if user.is_anonymous:
            return ChangeSet.objects.none()

        project_pk = self.kwargs.get('project_pk', None)

        if project_pk:
            project_ids = Project.get_all_sub_project_pks_for(project_pk)
            project_ids.append(project_pk)

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
                    # special case for CalendarAccess:
                    # it has no projects, so we can pass here
                    pass
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
        else:
            # project pk is required
            return ChangeSet.objects.none()


class ProjectTreeViewSet(BaseAuthenticatedModelViewSet, DeletableViewSetMixIn):
    """ ViewSet for querying project-trees;
    List-view returns the root-project (project without a parent) and all descendants
    Detail-view returns the requested project and all its descendants
    """
    serializer_class = ProjectTreeSerializer
    filterset_class = ProjectFilter
    search_fields = ()

    # disable pagination for this endpoint
    pagination_class = None

    def get_queryset(self):
        # get all viewable root projects and non-root projects where the parent is not viewable
        return Project.objects.viewable_with_orphans().prefetch_common()

    def retrieve(self, request, pk=None):
        queryset = Project.objects.viewable().prefetch_common()
        projecttree = get_object_or_404(queryset, pk=pk)
        serializer = ProjectTreeSerializer(projecttree)
        return Response(serializer.data)
