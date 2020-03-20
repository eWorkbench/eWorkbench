#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.core.management import BaseCommand

from eric.projects.models.cache import invalidate_project_cache


class Command(BaseCommand):
    help = 'Invalidates the project cache'

    def handle(self, *args, **options):
        invalidate_project_cache()
