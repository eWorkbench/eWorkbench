#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.apps import AppConfig


class IntegrationConfig(AppConfig):
    name = "eric.integration"

    def ready(self):
        # import handlers here so they are registered when the application starts
        import eric.integration.handlers
