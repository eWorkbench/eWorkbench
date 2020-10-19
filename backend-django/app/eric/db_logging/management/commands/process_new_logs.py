#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#

from django.core.management.base import BaseCommand

from eric.db_logging.log_processing import MailSender
from eric.db_logging.models.models import DBLog


class Command(BaseCommand):
    help = 'Processes new logs (e.g. sends an email for new logs)'

    def handle(self, *args, **options):
        processor = MailSender()

        new_logs_qs = DBLog.objects.filter(processed=False)
        if new_logs_qs.exists():
            processor.process_logs(new_logs_qs)
