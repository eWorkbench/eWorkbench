#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.contrib.contenttypes.models import ContentType
from django_changeset.models import ChangeSet
from django.shortcuts import get_object_or_404

from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response

from eric.projects.models import Project, ProjectRoleUserAssignment
from eric.projects.rest.filters import ProjectRoleUserAssignmentFilter
from eric.projects.rest.serializers import ProjectRoleUserAssignmentSerializerExtended, ChangeSetSerializer
from eric.projects.rest.viewsets.base import BaseAuthenticatedNestedProjectModelViewSet


class ProjectRoleUserAssignmentViewSet(BaseAuthenticatedNestedProjectModelViewSet):
    """ ViewSet for creating and querying projects;
    on query, only list the projects that an authenticated user is associated to (for now) """
    serializer_class = ProjectRoleUserAssignmentSerializerExtended

    search_fields = ('user__username', 'user__email', 'user__first_name', 'user__last_name',)
    filterset_class = ProjectRoleUserAssignmentFilter

    # disable pagination for this endpoint
    pagination_class = None

    def initial(self, request, *args, **kwargs):
        """
        Verify that we have access to the selected project
        Raises Http404 if we do not have access to the parent object
        """
        super(ProjectRoleUserAssignmentViewSet, self).initial(request, *args, **kwargs)

        if 'project_pk' in kwargs:
            get_object_or_404(Project.objects.viewable(), pk=kwargs['project_pk'])

    def get_queryset(self):
        """
        returns the queryset for ProjectRoleUserAssignment viewable objects,
        filtered by project primary (optional)
        """
        if 'project_pk' in self.kwargs:
            return ProjectRoleUserAssignment.objects.viewable()\
                .filter(project=self.kwargs['project_pk']).select_related(
                'role', 'user', 'user__userprofile', 'project'
            )
        else:
            return ProjectRoleUserAssignment.objects.viewable()\
                .select_related('role', 'user', 'user__userprofile', 'project')

    @action(detail=False, methods=['GET'])
    def get_assigned_users_up(self, request, *args, **kwargs):
        # get all parent project pks
        project = Project.objects.viewable().get(pk=self.kwargs['project_pk'])

        parent_project_pks = project.parent_pk_list

        qs = ProjectRoleUserAssignment.objects.viewable()\
            .filter(project__in=parent_project_pks).select_related('role', 'user', 'user__userprofile', 'project')

        return Response(self.get_serializer(qs, many=True).data)


class ProjectRoleUserAssignmentChangeSetViewSet(viewsets.ReadOnlyModelViewSet):
    """ Viewsets for changesets in projects """
    serializer_class = ChangeSetSerializer
    queryset = ChangeSet.objects.none()

    def get_queryset(self):
        return ChangeSet.objects.filter(object_type=ContentType.objects.get_for_model(ProjectRoleUserAssignment))
