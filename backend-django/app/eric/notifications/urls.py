#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from eric.core.rest.routers import get_api_router

from eric.notifications.rest.viewsets import NotificationConfigurationViewSet, NotificationViewSet, \
    ScheduledNotificationViewSet

# register REST API Routers
router = get_api_router()

# notification routes
router.register(r'notifications', NotificationViewSet, base_name='notifications')
router.register(r'notification_configuration', NotificationConfigurationViewSet, base_name='notification_configuration')
router.register(r'scheduled_notification', ScheduledNotificationViewSet, base_name='scheduled_notification')

urlpatterns = [
]
