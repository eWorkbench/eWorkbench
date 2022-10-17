#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.urls import re_path

from eric.websockets.consumers import NotificationConsumer, WorkbenchElementConsumer

websocket_urlpatterns = [
    re_path(r"^ws/elements/$", WorkbenchElementConsumer.as_asgi()),
    re_path(r"^ws/notifications/$", NotificationConsumer.as_asgi()),
]
