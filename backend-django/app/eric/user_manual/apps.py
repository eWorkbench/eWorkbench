#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.apps import AppConfig
from django.core.cache import cache

from eric.user_manual import PLACEHOLDER_CACHE_KEY


class UserManualConfig(AppConfig):
    name = 'eric.user_manual'

    def ready(self):
        # restore the cache
        cache.set(PLACEHOLDER_CACHE_KEY, None)
        # import handlers here so they are registered when the application starts
        import eric.user_manual.models.handlers
