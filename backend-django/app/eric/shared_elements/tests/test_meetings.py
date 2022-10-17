#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import json
from datetime import datetime

from django.contrib.auth import get_user_model

from rest_framework.status import HTTP_201_CREATED
from rest_framework.test import APITestCase

from eric.core.tests import HTTP_INFO
from eric.projects.tests.core import AuthenticationMixin
from eric.shared_elements.models import Meeting
from eric.shared_elements.tests.core import MeetingMixin

User = get_user_model()


class MeetingTest(APITestCase, AuthenticationMixin, MeetingMixin):
    def setUp(self):
        self.superuser = User.objects.create_superuser(
            username="su",
            email="su@test.local",
            password="top_secret",
        )
        self.token1 = self.login_and_return_token("su", "top_secret")

    def test_is_full_day_for_full_day(self):
        meeting = self.create_meeting(
            start_date=datetime(year=2019, month=4, day=30, hour=0, minute=0),
            end_date=datetime(year=2019, month=4, day=30, hour=23, minute=59),
        )
        self.assertTrue(meeting.is_full_day)

    def test_is_full_day_for_full_day_with_exclusive_time_format(self):
        meeting = self.create_meeting(
            start_date=datetime(year=2019, month=6, day=30, hour=0, minute=0),
            end_date=datetime(year=2019, month=7, day=1, hour=0, minute=0),
        )
        self.assertTrue(meeting.is_full_day)

    def test_is_full_day_for_more_than_24_hours(self):
        meeting = self.create_meeting(
            start_date=datetime(year=2019, month=6, day=30, hour=0, minute=0),
            end_date=datetime(year=2019, month=7, day=1, hour=0, minute=1),
        )
        self.assertFalse(meeting.is_full_day)

    def test_is_full_day_for_multiple_full_days(self):
        meeting = self.create_meeting(
            start_date=datetime(year=2019, month=4, day=25, hour=0, minute=0),
            end_date=datetime(year=2019, month=4, day=27, hour=23, minute=59),
        )
        self.assertTrue(meeting.is_full_day)

    def test_is_full_day_for_multiple_full_days_with_exclusive_format(self):
        meeting = self.create_meeting(
            start_date=datetime(year=2019, month=6, day=29, hour=0, minute=0),
            end_date=datetime(year=2019, month=7, day=3, hour=0, minute=0),
        )
        self.assertTrue(meeting.is_full_day)

    def test_is_full_day_for_half_day(self):
        meeting = self.create_meeting(
            start_date=datetime(year=2019, month=4, day=30, hour=0, minute=0),
            end_date=datetime(year=2019, month=4, day=30, hour=12, minute=0),
        )
        self.assertFalse(meeting.is_full_day)

    def create_meeting(self, start_date, end_date):
        response = self.rest_create_meeting(
            auth_token=self.token1,
            project_pks=[],
            title="MyMeeting",
            description="Description",
            start_date=start_date,
            end_date=end_date,
            **HTTP_INFO,
        )
        self.assertEqual(response.status_code, HTTP_201_CREATED)
        pk = json.loads(response.content.decode())["pk"]

        return Meeting.objects.get(pk=pk)
