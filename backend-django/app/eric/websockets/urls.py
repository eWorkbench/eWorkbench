#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.conf.urls import url

from eric.websockets.consumers import WorkbenchElementConsumer, NotificationConsumer


websocket_urlpatterns = [
    url(r'^ws/elements/$', WorkbenchElementConsumer),
    url(r'^ws/notifications/$', NotificationConsumer),
]
