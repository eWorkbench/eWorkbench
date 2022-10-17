#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import json

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.utils import timezone

from rest_framework import status
from rest_framework.test import APITestCase

from eric.projects.tests.core import AuthenticationMixin
from eric.shared_elements.models import Meeting
from eric.shared_elements.tests.core import MeetingMixin, UserAttendsMeetingMixin

User = get_user_model()

HTTP_USER_AGENT = "APITestClient"
REMOTE_ADDR = "127.0.0.1"


class AttendingAccessTest(APITestCase, AuthenticationMixin, MeetingMixin, UserAttendsMeetingMixin):
    """Extensive testing of api/meeting/ endpoint"""

    def setUp(self):
        """set up 3 users and a meeting"""

        # get user group
        self.user_group = Group.objects.get(name="User")

        # create 3 users and assign them to the user group
        self.user1 = User.objects.create_user(username="student_1", email="student_1@email.com", password="foobar")
        self.user1.groups.add(self.user_group)

        self.user2 = User.objects.create_user(username="student_2", email="student_2@email.com", password="foobar")
        self.user2.groups.add(self.user_group)

        self.user3 = User.objects.create_user(username="student_3", email="student_3@email.com", password="foobar")
        self.user3.groups.add(self.user_group)

        # login
        self.token1 = self.login_and_return_token("student_1", "foobar", HTTP_USER_AGENT, REMOTE_ADDR)
        self.token2 = self.login_and_return_token("student_2", "foobar", HTTP_USER_AGENT, REMOTE_ADDR)
        self.token3 = self.login_and_return_token("student_3", "foobar", HTTP_USER_AGENT, REMOTE_ADDR)

        # use user1 token
        self.client.credentials(HTTP_AUTHORIZATION="Token " + self.token1)

        # there should be zero meetings
        self.assertEqual(Meeting.objects.all().count(), 0)

        # meeting 1
        response = self.rest_create_meeting(
            self.token1,
            [],
            "First meeting",
            "Some Text for this meeting",
            timezone.now(),
            timezone.now(),
            HTTP_USER_AGENT,
            REMOTE_ADDR,
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        decoded = json.loads(response.content.decode())
        self.meeting1 = Meeting.objects.get(pk=decoded["pk"])

        # update the meeting to have user1 and user2 attending, but not user3
        user_pk_list = [self.user1.pk, self.user2.pk]
        response = self.update_attending_users(
            self.token1, self.meeting1.pk, user_pk_list, HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # unlock meeting1 with user1
        response = self.unlock(self.token1, "meetings", self.meeting1.pk, REMOTE_ADDR, HTTP_USER_AGENT)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # there should be one meeting
        self.assertEqual(Meeting.objects.all().count(), 1)

    def test_view_and_edit_access(self):
        """user2 should be able to view and edit the meeting as he is attending"""

        # user2 should see the meeting
        response = self.rest_get_meetings(self.token2, REMOTE_ADDR, HTTP_USER_AGENT)
        count = json.loads(response.content.decode())["count"]
        self.assertEqual(count, 1)

        # user3 should see no meetings
        response = self.rest_get_meetings(self.token3, REMOTE_ADDR, HTTP_USER_AGENT)
        count = json.loads(response.content.decode())["count"]
        self.assertEqual(count, 0)

        # user2 should be be able to edit the meeting
        response = self.rest_update_meeting(
            self.token2,
            self.meeting1.pk,
            [],
            "First meeting edited",
            "Some other Text for this meeting",
            timezone.now(),
            timezone.now(),
            HTTP_USER_AGENT,
            REMOTE_ADDR,
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # unlock meeting1 with user2
        response = self.unlock(self.token2, "meetings", self.meeting1.pk, REMOTE_ADDR, HTTP_USER_AGENT)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # user3 should not be able to edit the meeting, he can't even see it hence the 404
        response = self.rest_update_meeting(
            self.token3,
            self.meeting1.pk,
            [],
            "First meeting edited again",
            "Some other Text for this meeting again",
            timezone.now(),
            timezone.now(),
            HTTP_USER_AGENT,
            REMOTE_ADDR,
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_trash_and_restore_access(self):
        """user2 should be able to trash and restore the meeting as he is attending"""

        # user2 should see the meeting
        response = self.rest_get_meetings(self.token2, REMOTE_ADDR, HTTP_USER_AGENT)
        count = json.loads(response.content.decode())["count"]
        self.assertEqual(count, 1)

        # user3 should see no meetings
        response = self.rest_get_meetings(self.token3, REMOTE_ADDR, HTTP_USER_AGENT)
        count = json.loads(response.content.decode())["count"]
        self.assertEqual(count, 0)

        # user2 should be able to trash the meeting
        response = self.rest_trash_meeting(self.token2, self.meeting1.pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # user2 should be able to restore the meeting
        response = self.rest_restore_meeting(self.token2, self.meeting1.pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # unlock meeting1 with user2
        response = self.unlock(self.token2, "meetings", self.meeting1.pk, REMOTE_ADDR, HTTP_USER_AGENT)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # user3 should not be able to trash the meeting, he can't even see it hence the 404
        response = self.rest_trash_meeting(self.token3, self.meeting1.pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
