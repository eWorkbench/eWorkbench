#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
class NotificationMixIn:
    """
    Mixin for REST API Calls for notifications
    """
    def rest_get_notifications(self, auth_token, HTTP_USER_AGENT, REMOTE_ADDR):
        """
        Wrapper for getting notifications of a user
        """
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + auth_token)

        return self.client.get(
            '/api/notifications/',
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_mark_all_notifications_as_read(self, auth_token, HTTP_USER_AGENT, REMOTE_ADDR):
        """
        Wrapper for marking all notifications as read
        """
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + auth_token)

        return self.client.post(
            '/api/notifications/read_all/',
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_mark_notification_as_read(self, auth_token, notification_pk, HTTP_USER_AGENT, REMOTE_ADDR):
        """
        Wrapper for marking a single notification as read
        """
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + auth_token)

        return self.client.put(
            '/api/notifications/{pk}/read/'.format(pk=notification_pk),
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )
