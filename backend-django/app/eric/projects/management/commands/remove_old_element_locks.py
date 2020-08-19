#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import logging

from django.contrib.auth import get_user_model
from django.core.management import BaseCommand
from django.utils import timezone

from eric.core.models import disable_permission_checks
from eric.projects.models import ElementLock
from eric.site_preferences.models import options as site_preferences

User = get_user_model()

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Removes element locks that are older than 15 minutes'

    def handle(self, *args, **options):
        with disable_permission_checks(ElementLock):
            # calculate timedelta: 15 minutes from now
            timedelta = timezone.timedelta(minutes=site_preferences.element_lock_time_in_minutes)

            element_locks = ElementLock.objects.filter(
                # must be locked more than 15 minutes ago
                locked_at__lte=timezone.now() - timedelta
            )

            if element_locks.count() > 0:
                logger.debug("{}: Deleting {}/{} ElementLocks".format(
                    timezone.now(),
                    element_locks.count(),
                    ElementLock.objects.all().count()
                ))

            # deleting element locks might fail, if the model does not exist anymore
            # but there are still some instances of that model in the database
            # (should only ever happen in development environments where the database was not cleaned up)
            # So we clean up as much as we can, one by one, as fallback, and ignore non-deletable locks
            try:
                element_locks.delete()
            except Exception as e:
                logger.error(e)
                self.delete_locks_one_by_one()

    @staticmethod
    def delete_locks_one_by_one():
        for lock in ElementLock.objects.all():
            try:
                with disable_permission_checks(ElementLock):
                    lock.delete()
            except Exception as e:
                logger.error('Could not delete lock:')
                logger.error(e)
