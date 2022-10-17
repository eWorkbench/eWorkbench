#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#

import logging
from datetime import timedelta
from math import ceil

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.utils import timezone

from eric.projects.models import MyUser

User = get_user_model()
LOGGER = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Anonymize user profiles 10 years after the last login"

    def handle(self, *args, **options):
        current_time = timezone.now()
        time_threshold = current_time - timedelta(days=ceil(365.256 * MyUser.ANONYMIZE_AFTER_YEARS))
        users = User.objects.filter(userprofile__anonymized=False, last_login__lt=time_threshold)

        LOGGER.info(f"Found {users.count()} users to anonymize")

        for user in users:
            try:
                my_user = MyUser.objects.get(pk=user.pk)
                my_user.anonymize_expired()

                LOGGER.info(f"User {user} has been anonymized")
            except Exception as error:
                LOGGER.error(f"User {user} could not be anonymized: {error}")

        LOGGER.info("Anonymization finished")
