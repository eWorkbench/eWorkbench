#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.apps import AppConfig

from memoize import delete_memoized, memoize


class EricCoreConfig(AppConfig):
    name = "eric.core"

    def ready(self):
        from eric.core.views import get_current_version_from_git

        # clear cache for /api/version endpoint (stored using django memoize)
        delete_memoized(get_current_version_from_git)
