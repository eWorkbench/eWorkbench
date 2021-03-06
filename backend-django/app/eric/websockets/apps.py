#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.apps import AppConfig


class WebsocketsConfig(AppConfig):
    name = 'eric.websockets'

    def ready(self):
        # import handlers here so they are registered when the application starts
        import eric.websockets.consumers.handlers
