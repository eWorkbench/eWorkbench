#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from eric.core.models import BaseManager
from eric.notifications.models.querysets import (
    NotificationConfigurationQuerySet,
    NotificationQuerySet,
    ScheduledNotificationQuerySet,
)

NotificationConfigurationManager = BaseManager.from_queryset(NotificationConfigurationQuerySet)
NotificationManager = BaseManager.from_queryset(NotificationQuerySet)
ScheduledNotificationManager = BaseManager.from_queryset(ScheduledNotificationQuerySet)
