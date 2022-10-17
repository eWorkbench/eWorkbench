#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.apps import AppConfig


class DSSConfig(AppConfig):
    name = "eric.dss"

    def ready(self):
        # import handlers here so they are registered when the application starts
        import eric.dss.models.handlers

        # import model_privileges here so they are registered when the application starts
        import eric.dss.models.model_privileges
