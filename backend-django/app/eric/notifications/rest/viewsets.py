#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django_userforeignkey.request import get_current_user
from rest_framework.decorators import action
from rest_framework.pagination import LimitOffsetPagination
from rest_framework.response import Response

from eric.core.rest.viewsets import BaseAuthenticatedUpdateOnlyModelViewSet, BaseAuthenticatedReadOnlyModelViewSet
from eric.notifications.models import NotificationConfiguration, Notification
from eric.notifications.rest.filters import NotificationFilter
from eric.notifications.rest.serializers import NotificationConfigurationSerializer, NotificationSerializer


class NotificationConfigurationViewSet(BaseAuthenticatedUpdateOnlyModelViewSet):
    """REST API Viewset for notification configuration"""

    serializer_class = NotificationConfigurationSerializer
    search_fields = ()

    # disable pagination for this endpoint
    pagination_class = None

    def get_object(self):
        return NotificationConfiguration.objects.filter(user=get_current_user()).first()

    def list(self, request, *args, **kwargs):
        return self.retrieve(request, *args, **kwargs)

    def put(self, request, *args, **kwargs):
        """ override put method to allow updates on the "list" endpoint """
        return self.update(request, *args, **kwargs)


class NotificationViewSet(BaseAuthenticatedReadOnlyModelViewSet):
    """REST API Viewset for notifications"""

    serializer_class = NotificationSerializer
    search_fields = ()
    filter_class = NotificationFilter

    pagination_class = LimitOffsetPagination

    @action(detail=True, methods=['put'])
    def read(self, request, pk=None):
        """
        Mark a notification of the current user as read
        :param request:
        :param pk:
        :return:
        """
        obj = self.get_object()

        obj.read = True
        obj.save()

        return Response(self.get_serializer(instance=obj).data)

    @action(detail=False, methods=['post'])
    def read_all(self, request):
        """
        Mark all notifications of the current user as read as read
        :param request:
        :return:
        """
        for notification in self.get_queryset().filter(read=False):
            notification.read = True
            notification.save()

        return Response()

    def get_queryset(self):
        """
        get all viewable notifications for the current user, and also prefetch several things
        :return:
        """
        return Notification.objects.viewable().filter(
            user=get_current_user()
        ).select_related(
            'content_type',
            'created_by', 'created_by__userprofile',
            'last_modified_by', 'last_modified_by__userprofile'
        )
