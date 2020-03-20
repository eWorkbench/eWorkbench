#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
User = get_user_model()

from eric.userprofile.models import UserProfile


class Command(BaseCommand):
    help = 'Create User Profiles for all users'

    def handle(self, *args, **options):
        for user in User.objects.all():
            user_profile = UserProfile.objects.filter(user=user)
            if user_profile.count() == 0:
                UserProfile.objects.create(user=user)
