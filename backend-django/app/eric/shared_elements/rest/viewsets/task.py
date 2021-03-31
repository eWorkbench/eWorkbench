#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from rest_framework import viewsets

from eric.core.rest.viewsets import DeletableViewSetMixIn, ExportableViewSetMixIn
from eric.projects.rest.viewsets.base import BaseAuthenticatedCreateUpdateWithoutProjectModelViewSet, \
    LockableViewSetMixIn

from eric.shared_elements.models import Task
from eric.shared_elements.rest.filters import TaskFilter
from eric.shared_elements.rest.serializers import TaskSerializer


class TaskViewSet(
    BaseAuthenticatedCreateUpdateWithoutProjectModelViewSet, DeletableViewSetMixIn, ExportableViewSetMixIn,
    LockableViewSetMixIn
):
    """ REST API Viewset for tasks """
    serializer_class = TaskSerializer
    filterset_class = TaskFilter

    search_fields = ()
    ordering_fields = ('task_id', 'title', 'priority', 'state', 'start_date', 'due_date')

    def get_queryset(self):
        """
        returns the queryset for viewable Tasks with assigned users as well as the first changeset (insert changeset -
        used to enhance performance when querying created_by and created_at)
        """
        return Task.objects.viewable().prefetch_common(). \
            prefetch_related('projects')


class MyTaskViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = TaskSerializer
    filterset_class = TaskFilter
    search_fields = ()

    # disable pagination for this endpoint
    pagination_class = None

    def get_queryset(self):
        return Task.objects.viewable().assigned().prefetch_common()
