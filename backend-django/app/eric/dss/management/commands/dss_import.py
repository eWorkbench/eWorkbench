#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.core.management.base import BaseCommand

import eric.dss.tasks


class Command(BaseCommand):
    help = "Starts the dss import tasks"

    def handle(self, *args, **options):
        result = eric.dss.tasks.import_dss_files.delay()
        print(result)
