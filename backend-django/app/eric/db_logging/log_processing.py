#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import abc
import logging
import traceback

from django.core.mail import EmailMultiAlternatives
from django.db.models import QuerySet
from django.template.loader import render_to_string
from django.urls import reverse
from django.utils.translation import gettext_lazy as _

from django_userforeignkey.request import get_current_request

from eric.core.templatetags.site_preferences import absolute_site_url
from eric.db_logging.config import LOG_MAIL_RECEIVERS
from eric.site_preferences.models import options as site_preferences

LOGGER = logging.getLogger(__name__)


class LogProcessor(abc.ABC):
    """Represents a handler for new (unprocessed) logs"""

    @abc.abstractmethod
    def process_logs(self, logs_qs: QuerySet):
        pass


class MailSender(LogProcessor):
    """Processes new logs by sending them via email"""

    def process_logs(self, logs_qs):
        if not logs_qs.exists():
            LOGGER.debug("No logs to process")
            return

        try:
            self.send_aggregated_logs_mail(logs_qs)
        except Exception as exc:
            print(f"Log processing failed: {exc}")
            traceback.print_exc()
            raise
        else:
            rows = logs_qs.update(processed=True)
            LOGGER.info(f"Processed {rows} logs")

    @staticmethod
    def send_aggregated_logs_mail(logs_qs):
        # group logs by hash
        grouped_logs = list()
        log_hash_collection = set(logs_qs.values_list("hash", flat=True))
        for log_hash in log_hash_collection:
            logs_for_hash = logs_qs.filter(hash=log_hash)
            first_log = logs_for_hash.first()
            admin_url = absolute_site_url("admin:db_logging_dblog_changelist") + f"?hash={log_hash}"
            grouped_logs.append(
                {
                    "message": first_log.message,
                    "trace": first_log.trace,
                    "admin_url": admin_url,
                    "occurrences": logs_for_hash.order_by("created_at"),
                }
            )

        template_context = {
            "site_preferences": site_preferences,
            "grouped_logs": grouped_logs,
            "admin_url": reverse("admin:db_logging_dblog_changelist"),
        }
        plaintext_content = render_to_string("log_mail.txt", template_context)

        site_name = site_preferences.site_name
        msg = EmailMultiAlternatives(
            subject=_(f"[{site_name}] Django Logs: {logs_qs.count()} new logs"),
            body=plaintext_content,
            from_email=site_preferences.email_from,
            to=LOG_MAIL_RECEIVERS,
        )

        try:
            sent_count = msg.send()
            LOGGER.info(f"Sent {sent_count} log mails")
        except Exception as exc:
            LOGGER.exception(exc)
