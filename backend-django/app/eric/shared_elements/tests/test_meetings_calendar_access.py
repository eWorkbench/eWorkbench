#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import json
from django.contrib.auth.models import Group
from django.contrib.auth import get_user_model

from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from eric.model_privileges.models import ModelPrivilege
from eric.shared_elements.models import Meeting, CalendarAccess
from eric.projects.tests.core import AuthenticationMixin, ModelPrivilegeMixin
from eric.shared_elements.tests.core import MeetingMixin


User = get_user_model()

HTTP_USER_AGENT = "APITestClient"
REMOTE_ADDR = "127.0.0.1"


class CalendarAccessTest(APITestCase, AuthenticationMixin, MeetingMixin, ModelPrivilegeMixin):
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
        response = self.rest_create_meeting(self.token1, [], "First meeting",
                                            "Some Text for this meeting",
                                            timezone.now(), timezone.now(), HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_201_CREATED)
        decoded = json.loads(response.content.decode())
        self.meeting1 = Meeting.objects.get(pk=decoded['pk'])

        # unlock meeting1 with user1
        response = self.unlock(self.token1, "meetings", self.meeting1.pk, REMOTE_ADDR, HTTP_USER_AGENT)
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # there should be one meeting
        self.assertEquals(Meeting.objects.all().count(), 1)

    def test_view_access(self):
        """ user2 should be able to view the meeting after getting the calendar access to view user1s calendar"""

        # user2 should see no meetings yet
        response = self.rest_get_meetings(self.token2, REMOTE_ADDR, HTTP_USER_AGENT)
        count = json.loads(response.content.decode())['count']
        self.assertEquals(count, 0)

        # get the calendar access of user1
        user1_calendar_access_id = ModelPrivilege.objects.all().filter(
            content_type=CalendarAccess.get_content_type(),
            user=self.user1,
            created_by=self.user1,
        ).first().object_id

        # create a new empty privilege for user2
        response = self.rest_create_privilege(
            self.token1, "calendar-access-privileges", user1_calendar_access_id, self.user2.pk,
            HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEquals(response.status_code, status.HTTP_201_CREATED)

        # give user2 view access to user1s calendar
        response = self.rest_patch_privilege(
            self.token1, "calendar-access-privileges", user1_calendar_access_id, self.user2.pk,
            {'view_privilege': ModelPrivilege.ALLOW}, HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # user2 should be able to view the meeting now
        response = self.rest_get_meetings(self.token2, REMOTE_ADDR, HTTP_USER_AGENT)
        count = json.loads(response.content.decode())['count']
        self.assertEquals(count, 1)

        # user2 should not be able to edit the meeting though
        response = self.rest_update_meeting(
            self.token2, self.meeting1.pk, [], "First meeting edited",
            "Some other Text for this meeting",
            timezone.now(), timezone.now(),
            HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEquals(response.status_code, status.HTTP_403_FORBIDDEN)

        # user2 should not be able to trash the meeting though
        response = self.rest_trash_meeting(
            self.token2, self.meeting1.pk,
            HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEquals(response.status_code, status.HTTP_403_FORBIDDEN)

        # user3 should still see no meetings
        response = self.rest_get_meetings(self.token3, REMOTE_ADDR, HTTP_USER_AGENT)
        count = json.loads(response.content.decode())['count']
        self.assertEquals(count, 0)

    def test_view_and_edit_access(self):
        """
        user2 should be able to view and edit the meeting after getting the calendar access to
        view and edit user1s calendar
        """

        # user2 should see no meetings yet
        response = self.rest_get_meetings(self.token2, REMOTE_ADDR, HTTP_USER_AGENT)
        count = json.loads(response.content.decode())['count']
        self.assertEquals(count, 0)

        # get the calendar access of user1
        user1_calendar_access_id = ModelPrivilege.objects.all().filter(
            content_type=CalendarAccess.get_content_type(),
            user=self.user1,
            created_by=self.user1,
        ).first().object_id

        # create a new empty privilege for user2
        response = self.rest_create_privilege(
            self.token1, "calendar-access-privileges", user1_calendar_access_id, self.user2.pk,
            HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEquals(response.status_code, status.HTTP_201_CREATED)

        # give user2 view access to user1s calendar
        response = self.rest_patch_privilege(
            self.token1, "calendar-access-privileges", user1_calendar_access_id, self.user2.pk,
            {'view_privilege': ModelPrivilege.ALLOW, 'edit_privilege': ModelPrivilege.ALLOW},
            HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # user2 should be able to view the meeting now
        response = self.rest_get_meetings(self.token2, REMOTE_ADDR, HTTP_USER_AGENT)
        count = json.loads(response.content.decode())['count']
        self.assertEquals(count, 1)

        # user2 should be able to edit the meeting
        response = self.rest_update_meeting(
            self.token2, self.meeting1.pk, [], "First meeting edited",
            "Some other Text for this meeting",
            timezone.now(), timezone.now(),
            HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # user2 should not be able to trash the meeting though
        response = self.rest_trash_meeting(
            self.token2, self.meeting1.pk,
            HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEquals(response.status_code, status.HTTP_403_FORBIDDEN)

        # user3 should still see no meetings
        response = self.rest_get_meetings(self.token3, REMOTE_ADDR, HTTP_USER_AGENT)
        count = json.loads(response.content.decode())['count']
        self.assertEquals(count, 0)

    def test_view_edit_and_trash_access(self):
        """
        user2 should be able to view and edit the meeting after getting the calendar access to
        view and edit user1s calendar
        """

        # user2 should see no meetings yet
        response = self.rest_get_meetings(self.token2, REMOTE_ADDR, HTTP_USER_AGENT)
        count = json.loads(response.content.decode())['count']
        self.assertEquals(count, 0)

        # get the calendar access of user1
        user1_calendar_access_id = ModelPrivilege.objects.all().filter(
            content_type=CalendarAccess.get_content_type(),
            user=self.user1,
            created_by=self.user1,
        ).first().object_id

        # create a new empty privilege for user2
        response = self.rest_create_privilege(
            self.token1, "calendar-access-privileges", user1_calendar_access_id, self.user2.pk,
            HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEquals(response.status_code, status.HTTP_201_CREATED)

        # give user2 view access to user1s calendar
        response = self.rest_patch_privilege(
            self.token1, "calendar-access-privileges", user1_calendar_access_id, self.user2.pk,
            {
                'view_privilege': ModelPrivilege.ALLOW,
                'edit_privilege': ModelPrivilege.ALLOW,
                'trash_privilege': ModelPrivilege.ALLOW,
            },
            HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # user2 should be able to view the meeting now
        response = self.rest_get_meetings(self.token2, REMOTE_ADDR, HTTP_USER_AGENT)
        count = json.loads(response.content.decode())['count']
        self.assertEquals(count, 1)

        # user2 should be able to edit the meeting
        response = self.rest_update_meeting(
            self.token2, self.meeting1.pk, [], "First meeting edited",
            "Some other Text for this meeting",
            timezone.now(), timezone.now(),
            HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # user2 should be able to trash the meeting
        response = self.rest_trash_meeting(
            self.token2, self.meeting1.pk,
            HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # user2 should not be able to restore the meeting though
        response = self.rest_restore_meeting(
            self.token2, self.meeting1.pk,
            HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEquals(response.status_code, status.HTTP_403_FORBIDDEN)

        # user3 should still see no meetings
        response = self.rest_get_meetings(self.token3, REMOTE_ADDR, HTTP_USER_AGENT)
        count = json.loads(response.content.decode())['count']
        self.assertEquals(count, 0)

    def test_view_edit_trash_and_restore_access(self):
        """
        user2 should be able to view and edit the meeting after getting the calendar access to
        view and edit user1s calendar
        """

        # user2 should see no meetings yet
        response = self.rest_get_meetings(self.token2, REMOTE_ADDR, HTTP_USER_AGENT)
        count = json.loads(response.content.decode())['count']
        self.assertEquals(count, 0)

        # get the calendar access of user1
        user1_calendar_access_id = ModelPrivilege.objects.all().filter(
            content_type=CalendarAccess.get_content_type(),
            user=self.user1,
            created_by=self.user1,
        ).first().object_id

        # create a new empty privilege for user2
        response = self.rest_create_privilege(
            self.token1, "calendar-access-privileges", user1_calendar_access_id, self.user2.pk,
            HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEquals(response.status_code, status.HTTP_201_CREATED)

        # give user2 view access to user1s calendar
        response = self.rest_patch_privilege(
            self.token1, "calendar-access-privileges", user1_calendar_access_id, self.user2.pk,
            {
                'view_privilege': ModelPrivilege.ALLOW,
                'edit_privilege': ModelPrivilege.ALLOW,
                'trash_privilege': ModelPrivilege.ALLOW,
                'restore_privilege': ModelPrivilege.ALLOW,
            },
            HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # user2 should be able to view the meeting now
        response = self.rest_get_meetings(self.token2, REMOTE_ADDR, HTTP_USER_AGENT)
        count = json.loads(response.content.decode())['count']
        self.assertEquals(count, 1)

        # user2 should be able to edit the meeting
        response = self.rest_update_meeting(
            self.token2, self.meeting1.pk, [], "First meeting edited",
            "Some other Text for this meeting",
            timezone.now(), timezone.now(),
            HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # user2 should be able to trash the meeting
        response = self.rest_trash_meeting(
            self.token2, self.meeting1.pk,
            HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # user2 should be able to restore the meeting
        response = self.rest_restore_meeting(
            self.token2, self.meeting1.pk,
            HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # user3 should still see no meetings
        response = self.rest_get_meetings(self.token3, REMOTE_ADDR, HTTP_USER_AGENT)
        count = json.loads(response.content.decode())['count']
        self.assertEquals(count, 0)

    def test_full_access(self):
        """
        user2 should be able to view and edit the meeting after getting the calendar access to
        view and edit user1s calendar
        """

        # user2 should see no meetings yet
        response = self.rest_get_meetings(self.token2, REMOTE_ADDR, HTTP_USER_AGENT)
        count = json.loads(response.content.decode())['count']
        self.assertEquals(count, 0)

        # get the calendar access of user1
        user1_calendar_access_id = ModelPrivilege.objects.all().filter(
            content_type=CalendarAccess.get_content_type(),
            user=self.user1,
            created_by=self.user1,
        ).first().object_id

        # create a new empty privilege for user2
        response = self.rest_create_privilege(
            self.token1, "calendar-access-privileges", user1_calendar_access_id, self.user2.pk,
            HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEquals(response.status_code, status.HTTP_201_CREATED)

        # give user2 view access to user1s calendar
        response = self.rest_patch_privilege(
            self.token1, "calendar-access-privileges", user1_calendar_access_id, self.user2.pk,
            {
                'full_access_privilege': ModelPrivilege.ALLOW,
            },
            HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # user2 should be able to view the meeting now
        response = self.rest_get_meetings(self.token2, REMOTE_ADDR, HTTP_USER_AGENT)
        count = json.loads(response.content.decode())['count']
        self.assertEquals(count, 1)

        # user2 should be able to edit the meeting
        response = self.rest_update_meeting(
            self.token2, self.meeting1.pk, [], "First meeting edited",
            "Some other Text for this meeting",
            timezone.now(), timezone.now(),
            HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # user2 should be able to trash the meeting
        response = self.rest_trash_meeting(
            self.token2, self.meeting1.pk,
            HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # user2 should be able to restore the meeting
        response = self.rest_restore_meeting(
            self.token2, self.meeting1.pk,
            HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # user3 should still see no meetings
        response = self.rest_get_meetings(self.token3, REMOTE_ADDR, HTTP_USER_AGENT)
        count = json.loads(response.content.decode())['count']
        self.assertEquals(count, 0)

