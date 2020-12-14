#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.db.models import options

default_app_config = 'eric.favourites.apps.FavouriteConfig'

# extend allowed meta options for models
# used to specify which model can be marked as favourite
options.DEFAULT_NAMES = options.DEFAULT_NAMES + (
    'is_favouritable',
)
