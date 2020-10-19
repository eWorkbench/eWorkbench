#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import logging
from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from eric.db_logging.models.models import DBLog

LOGGER = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Deletes old logs (processed logs older than 30 days)'

    def handle(self, *args, **options):
        dt_limit = timezone.now() - timedelta(days=30)
        old_entries_qs = DBLog.objects.filter(processed=True, created_at__lt=dt_limit)

        delete_count, delete_dict = old_entries_qs.delete()

        LOGGER.info(f'Deleted {delete_count} entries older than {dt_limit}')
