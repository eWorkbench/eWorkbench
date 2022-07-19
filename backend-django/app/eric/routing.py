#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator

import eric.websockets.urls


"""
Basic Routing for ASGI/Websockets

For information, please consult the django channels documentation:
- https://channels.readthedocs.io/en/latest/topics/security.html
- https://channels.readthedocs.io/en/latest/topics/routing.html
"""

application = ProtocolTypeRouter({
    'http': get_asgi_application(),
    # make sure only the hosts listed in ALLOWED_HOSTS are able to connect to the websockets
    'websocket': AllowedHostsOriginValidator(
        URLRouter(
            eric.websockets.urls.websocket_urlpatterns
        )
    ),
})
