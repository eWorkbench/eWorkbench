#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import logging

# do not import settings here, as this would lead to an import-cycle
# (DatabaseLogHandler is referenced and imported in settings)
from django.views.debug import ExceptionReporter

default_formatter = logging.Formatter()


class ReducedExceptionReporter(ExceptionReporter):
    def get_traceback_data(self):
        data = super().get_traceback_data()
        for key in [
            "settings",
            "sys_executable",
            "sys_version_info",
            "sys_path",
        ]:
            del data[key]

        return data


class DatabaseLogHandler(logging.Handler):
    def emit(self, record):
        try:
            from eric.db_logging.config import EXCLUDED_LOGGERS
            from eric.db_logging.models.models import DBLog

            if record.name not in EXCLUDED_LOGGERS:
                trace = default_formatter.formatException(record.exc_info) if record.exc_info else None
                DBLog.objects.create(
                    logger_name=record.name,
                    level=record.levelno,
                    message=record.getMessage(),
                    trace=trace,
                    request_info=self.aggregate_request_info(record),
                )
        except Exception:
            # avoid endless error logging recursion in case there is a problem with the logger
            print(record)

    def aggregate_request_info(self, record):
        try:
            request = record.request
        except Exception:
            request = None

        if record.exc_info:
            exc_info = record.exc_info
        else:
            exc_info = (None, record.getMessage(), None)

        reporter = ReducedExceptionReporter(request, *exc_info)
        return reporter.get_traceback_text()

    def format(self, record):
        if self.formatter:
            fmt = self.formatter
        else:
            fmt = default_formatter

        if type(fmt) == logging.Formatter:
            record.message = record.getMessage()

            if fmt.usesTime():
                record.asctime = fmt.formatTime(record, fmt.datefmt)

            # ignore exception traceback and stack info

            return fmt.formatMessage(record)
        else:
            return fmt.format(record)
