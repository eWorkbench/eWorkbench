#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import json

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.db.models.signals import post_save
from django.dispatch import receiver

from eric.notifications.models import Notification
from eric.websockets.consumers.core import AuthenticatedWorkbenchJsonWebsocketConsumer


NOTIFICATION_CHANNEL_GROUP = "notifications_user_{user_pk}"


@receiver(post_save, sender=Notification)
def notification_has_changed(instance, created, *args, **kwargs):
    # send an info to the channel of the current user

    # get current channel
    channel_layer = get_channel_layer()

    # check if channel layer is available (e.g., in unit tests this is not available)
    if channel_layer:
        # group name
        group_name = NOTIFICATION_CHANNEL_GROUP.format(user_pk=instance.user.pk)

        async_to_sync(channel_layer.group_send)(
            group_name,
            {
                'type': 'notification_changed',
                'message': {
                    'pk': str(instance.pk)
                }
            }
        )


class NotificationConsumer(AuthenticatedWorkbenchJsonWebsocketConsumer):
    """
    A Websocket consumer that lets the user watch their notifications

    If a new notification is created or an existing notification is updated, the websockets notifies the channel for
    the user.
    """
    def connect(self):
        # we're accepting any connection, auth is handled in the `authentication_success` method in
        # `AuthenticatedWorkbenchJsonWebsocketConsumer`
        self.accept()

    def disconnect(self, close_code):
        # Leave notification group with this channel
        async_to_sync(self.channel_layer.group_discard)(
            self.group_name,
            self.channel_name
        )

    def receive_json_authenticated(self, content):
        # we do not expect the user to send anything over this channel
        pass

    def authentication_success(self, user):
        """
        If authentication was successful, we can subscribe to the users notification stream
        :param user:
        :return:
        """
        # create and store the group name for this user
        self.group_name = NOTIFICATION_CHANNEL_GROUP.format(user_pk=user.pk)

        # Join notification group with the current channel
        async_to_sync(self.channel_layer.group_add)(
            self.group_name,
            self.channel_name
        )

    def notification_changed(self, event):
        """
        Event fired when a notification has changed

        Notify the current channel about this change
        :param event:
        :return:
        """
        message = event['message']

        # Send message to WebSocket
        self.send(text_data=json.dumps({
            'message': message
        }))
