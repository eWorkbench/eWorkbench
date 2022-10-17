#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from eric.core.rest.filters import BaseFilter
from eric.notifications.models import Notification, ScheduledNotification


class NotificationFilter(BaseFilter):
    """Filter for Notifications, which allows filtering for the created_at field of the notification"""

    class Meta:
        model = Notification
        fields = {"created_at": BaseFilter.DATE_COMPERATORS, "last_modified_at": BaseFilter.DATE_COMPERATORS}


class ScheduledNotificationFilter(BaseFilter):
    """Filter for ScheduledNotifications, allows filtering for the object_id field of the scheduled notification"""

    class Meta:
        model = ScheduledNotification
        fields = {"object_id": BaseFilter.FOREIGNKEY_COMPERATORS}
