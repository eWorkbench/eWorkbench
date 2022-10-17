#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import logging

from django.core.management.base import BaseCommand

LOGGER = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Creates test logs for all log-types"

    def handle(self, *args, **options):
        LOGGER.critical("TEST LOG: Critical")
        LOGGER.exception("TEST LOG: Exception")
        LOGGER.error("TEST LOG: Error")
        LOGGER.warning("TEST LOG: Warning")
        LOGGER.info("TEST LOG: Info")
        LOGGER.debug("TEST LOG: Debug")
