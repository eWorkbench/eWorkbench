#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
"""
ASGI entrypoint. Configures Django and then runs the application
defined in the ASGI_APPLICATION setting.
"""

import os

import django

from channels.routing import get_default_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "eric.settings.base")
django.setup()
application = get_default_application()
