#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.apps import AppConfig


class FavouriteConfig(AppConfig):
    name = 'eric.favourites'

    def ready(self):
        # import handlers here so they are registered when the application starts
        import eric.favourites.models.handlers
