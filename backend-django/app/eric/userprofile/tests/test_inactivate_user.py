#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from datetime import datetime, timedelta

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group

from rest_framework.test import APITestCase

import time_machine

from eric.projects.tests.core import AuthenticationMixin, MeMixin, UserMixin
from eric.userprofile.models import UserProfile
from eric.userprofile.tasks import inactivate_user

User = get_user_model()


class InactivateUserTest(
    APITestCase,
    AuthenticationMixin,
    UserMixin,
    MeMixin,
):
    def setUp(self):
        self.user_group = Group.objects.get(name="User")
        self.external_group = Group.objects.get(name="External")

        self.testuser1 = User.objects.create_user(
            username="testuser1", email="testuser1@email.com", password="top_secret"
        )
        self.token1 = self.login_and_return_token("testuser1", "top_secret")
        self.testuser1.groups.add(self.user_group)

        self.testuser2 = User.objects.create_user(
            username="testuser2", email="testuser2@email.com", password="other_top_secret"
        )
        self.token2 = self.login_and_return_token("testuser2", "other_top_secret")
        self.testuser2.groups.add(self.user_group)
        self.testuser2.groups.add(self.external_group)

    def test_alum_user(self):
        now = datetime.now()
        with time_machine.travel(now, tick=False):
            user_profile = UserProfile.objects.filter(user=self.testuser1.pk).first()
            user_profile.affiliation_prim = UserProfile.ALUM
            user_profile.save()

            user_profile = UserProfile.objects.filter(user=self.testuser1.pk).first()
            alum_timestamp = user_profile.alum_timestamp.replace(tzinfo=None)
            self.assertEqual(alum_timestamp, now)

            user_profile = UserProfile.objects.filter(user=self.testuser1.pk).first()
            user_profile.affiliation_prim = UserProfile.MEMBER
            user_profile.save()
            self.assertEqual(user_profile.alum_timestamp, None)

    def test_inactive_timestamp(self):
        now = datetime.now()
        with time_machine.travel(now, tick=False):
            user = User.objects.get(pk=self.testuser1.pk)
            user.is_active = False
            user.save()

            user_profile = UserProfile.objects.filter(user=self.testuser1.pk).first()
            inactivated_at = user_profile.inactivated_at.replace(tzinfo=None)
            self.assertEqual(inactivated_at, now)

            user.is_active = True
            user.save()

            user_profile = UserProfile.objects.filter(user=self.testuser1.pk).first()
            self.assertEqual(user_profile.inactivated_at, None)

    def test_inactivate_user_command(self):
        four_months_ago = datetime.now() - timedelta(days=120)
        seven_years_ago = datetime.now() - timedelta(days=365 * 7)

        # celery task
        inactivate_user()

        user1 = User.objects.get(pk=self.testuser1.pk)
        self.assertEqual(user1.is_active, True)

        user2 = User.objects.get(pk=self.testuser2.pk)
        self.assertEqual(user2.is_active, True)

        with time_machine.travel(four_months_ago, tick=False):
            user_profile = UserProfile.objects.filter(user=self.testuser1.pk).first()
            user_profile.affiliation_prim = UserProfile.ALUM
            user_profile.save()

        with time_machine.travel(seven_years_ago, tick=False):
            user = User.objects.get(pk=self.testuser2.pk)
            user.date_joined = datetime.now()
            user.save()

        # celery task
        inactivate_user()

        user1 = User.objects.get(pk=self.testuser1.pk)
        self.assertEqual(user1.is_active, False)

        user2 = User.objects.get(pk=self.testuser2.pk)
        self.assertEqual(user2.is_active, False)
