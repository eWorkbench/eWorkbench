#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from eric.core.rest.filters import BaseFilter
from eric.notifications.models import Notification


class NotificationFilter(BaseFilter):
    """ Filter for Notifications, which allows filtering for the created_at field of the notification """
    class Meta:
        model = Notification
        fields = {
            'created_at': BaseFilter.DATE_COMPERATORS,
            'last_modified_at': BaseFilter.DATE_COMPERATORS
        }
