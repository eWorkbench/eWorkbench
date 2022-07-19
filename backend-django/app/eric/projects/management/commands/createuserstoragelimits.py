#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.utils.translation import gettext_lazy as _

from eric.projects.models import UserStorageLimit

User = get_user_model()


class Command(BaseCommand):
    help = 'Ensure that each active user has a user storage limits'

    def handle(self, *args, **options):
        users = User.objects.filter(
            is_active=True, last_login__isnull=False
        ).select_related('user_storage_limit')

        for user in users:
            try:
                a = user.user_storage_limit
            except Exception:
                print("No storage limit exists for {user}, creating it...".format(user=user))

                UserStorageLimit.objects.create(
                    user_id=user.pk,
                    storage_megabyte=settings.DEFAULT_QUOTA_PER_USER_MEGABYTE,
                    comment=_("Auto-generated (management command) storage limit of {storage_limit} MB".format(
                        storage_limit=settings.DEFAULT_QUOTA_PER_USER_MEGABYTE)
                    )
                )

                print("- User storage limit for {user} with a maximum of {storage_megabyte} MB was created"
                      .format(user=user, storage_megabyte=settings.DEFAULT_QUOTA_PER_USER_MEGABYTE))
