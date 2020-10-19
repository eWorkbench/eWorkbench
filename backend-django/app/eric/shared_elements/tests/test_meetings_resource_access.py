#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import json
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from eric.core.tests import HTTP_USER_AGENT, REMOTE_ADDR, HTTP_INFO
from eric.projects.tests.core import AuthenticationMixin, ResourceMixin
from eric.shared_elements.models import Meeting, Resource
from eric.shared_elements.tests.core import MeetingMixin

User = get_user_model()


class ResourceAccessTest(APITestCase, AuthenticationMixin, MeetingMixin, ResourceMixin):
    """ Extensive testing of api/meeting/ endpoint
    """

    def setUp(self):
        """ set up 3 users and a meeting"""

        # get user group
        self.user_group = Group.objects.get(name='User')

        # create 3 users and assign them to the user group
        self.user1 = User.objects.create_user(
            username='student_1', email='student_1@email.com', password='foobar')
        self.user1.groups.add(self.user_group)

        self.user2 = User.objects.create_user(
            username='student_2', email='student_2@email.com', password='foobar')
        self.user2.groups.add(self.user_group)

        self.user3 = User.objects.create_user(
            username='student_3', email='student_3@email.com', password='foobar')
        self.user3.groups.add(self.user_group)

        # login
        self.token1 = self.login_and_return_token('student_1', 'foobar', HTTP_USER_AGENT, REMOTE_ADDR)
        self.token2 = self.login_and_return_token('student_2', 'foobar', HTTP_USER_AGENT, REMOTE_ADDR)
        self.token3 = self.login_and_return_token('student_3', 'foobar', HTTP_USER_AGENT, REMOTE_ADDR)

        # use user1 token
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + self.token1)

        # there should be zero meetings
        self.assertEquals(Meeting.objects.all().count(), 0)

        # meeting 1
        # response = self.rest_create_meeting(self.token1, [], "First meeting",
        #                                     "Some Text for this meeting",
        #                                     timezone.now(), timezone.now(), HTTP_USER_AGENT, REMOTE_ADDR)
        # self.assertEquals(response.status_code, status.HTTP_201_CREATED)
        # decoded = json.loads(response.content.decode())
        # self.meeting1 = Meeting.objects.get(pk=decoded['pk'])

        # resource1 created by user2
        self.resource1 = self.rest_create_resource(
            auth_token=self.token2,
            project_pks=None,
            name="Test Resource of user2",
            description="Test Description",
            resource_type=Resource.ROOM,
            user_availability=Resource.GLOBAL,
            **HTTP_INFO
        )
        self.resource1 = Resource.objects.get(pk=json.loads(self.resource1.content.decode())["pk"])

        # book resource1 with user1
        response = self.rest_create_resource_booking(
            auth_token=self.token1,
            title='Appointment',
            date_time_start=timezone.now(),
            date_time_end=timezone.now() + timedelta(hours=1),
            resource_pk=self.resource1.pk,
            **HTTP_INFO
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        decoded = json.loads(response.content.decode())
        self.meeting1 = Meeting.objects.get(pk=decoded['pk'])

        # unlock meeting1 with user1
        response = self.unlock(self.token1, "meetings", self.meeting1.pk, REMOTE_ADDR, HTTP_USER_AGENT)
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # there should be one meeting
        self.assertEquals(Meeting.objects.all().count(), 1)

    def test_view_and_edit_access(self):
        """
        user2 should be able to view and edit the meeting as he is the owner
        of the resource the meeting has booked
        """

        # user1 should see the meeting as he created the meeting
        response = self.rest_get_meetings(self.token1, REMOTE_ADDR, HTTP_USER_AGENT)
        count = json.loads(response.content.decode())['count']
        self.assertEquals(count, 1)

        # user2 should see the meeting as he owns the resource
        response = self.rest_get_meetings(self.token2, REMOTE_ADDR, HTTP_USER_AGENT)
        count = json.loads(response.content.decode())['count']
        self.assertEquals(count, 1)

        # user3 should see no meetings
        response = self.rest_get_meetings(self.token3, REMOTE_ADDR, HTTP_USER_AGENT)
        count = json.loads(response.content.decode())['count']
        self.assertEquals(count, 0)

        # user1 should be be able to edit the meeting as he created the meeting
        response = self.rest_update_meeting(
            self.token1, self.meeting1.pk, [], "First meeting edited",
            "Some other Text for this meeting",
            timezone.now(), timezone.now(),
            HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # unlock meeting1 with user1
        response = self.unlock(self.token1, "meetings", self.meeting1.pk, REMOTE_ADDR, HTTP_USER_AGENT)
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # user2 should be be able to edit the meeting as he owns the resource
        response = self.rest_update_meeting(
            self.token2, self.meeting1.pk, [], "First meeting edited again",
            "Some other Text for this meeting again",
            timezone.now(), timezone.now(),
            HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # unlock meeting1 with user2
        response = self.unlock(self.token2, "meetings", self.meeting1.pk, REMOTE_ADDR, HTTP_USER_AGENT)
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # user3 should not be able to edit the meeting, he can't even see it hence the 404
        response = self.rest_update_meeting(
            self.token3, self.meeting1.pk, [], "First meeting edited again",
            "Some other Text for this meeting again",
            timezone.now(), timezone.now(),
            HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEquals(response.status_code, status.HTTP_404_NOT_FOUND)

        # unbook the resource
        response = self.rest_update_meeting_remove_resource(
            self.token1, self.meeting1.pk,
            HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # user1 should see the meeting as he created the meeting
        response = self.rest_get_meetings(self.token1, REMOTE_ADDR, HTTP_USER_AGENT)
        count = json.loads(response.content.decode())['count']
        self.assertEquals(count, 1)

        # user2 should not see the meeting now as the resource was unbooked
        response = self.rest_get_meetings(self.token2, REMOTE_ADDR, HTTP_USER_AGENT)
        count = json.loads(response.content.decode())['count']
        self.assertEquals(count, 0)

    def test_trash_and_restore_access(self):
        """
        user2 should be able to trash and restore the meeting as he is the owner
        of the resource the meeting has booked
        """
        # user1 should be be able to trash the meeting as he created the meeting
        response = self.rest_trash_meeting(
            self.token1, self.meeting1.pk,
            HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # user1 should be able to restore the meeting as he created the meeting
        response = self.rest_restore_meeting(
            self.token1, self.meeting1.pk,
            HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # unlock meeting1 with user1
        response = self.unlock(self.token1, "meetings", self.meeting1.pk, REMOTE_ADDR, HTTP_USER_AGENT)
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # user2 should be be able to trash the meeting as he owns the resource
        response = self.rest_trash_meeting(
            self.token2, self.meeting1.pk,
            HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # user2 should be able to restore the meeting as he owns the resource
        response = self.rest_restore_meeting(
            self.token2, self.meeting1.pk,
            HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # unlock meeting1 with user2
        response = self.unlock(self.token2, "meetings", self.meeting1.pk, REMOTE_ADDR, HTTP_USER_AGENT)
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # user3 should not be able to trash the meeting, he can't even see it hence the 404
        response = self.rest_trash_meeting(
            self.token3, self.meeting1.pk,
            HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEquals(response.status_code, status.HTTP_404_NOT_FOUND)

        # unbook the resource
        response = self.rest_update_meeting_remove_resource(
            self.token1, self.meeting1.pk,
            HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # user1 should see the meeting as he created the meeting
        response = self.rest_get_meetings(self.token1, REMOTE_ADDR, HTTP_USER_AGENT)
        count = json.loads(response.content.decode())['count']
        self.assertEquals(count, 1)

        # user2 should not be able to trash the meeting now as the resource was unbooked
        response = self.rest_trash_meeting(
            self.token2, self.meeting1.pk,
            HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEquals(response.status_code, status.HTTP_404_NOT_FOUND)
