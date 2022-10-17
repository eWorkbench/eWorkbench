#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import json

from django.utils import timezone
from django.utils.timezone import timedelta

from rest_framework import status
from rest_framework.test import APITestCase

from eric.core.tests import HTTP_USER_AGENT, REMOTE_ADDR, test_utils
from eric.model_privileges.models import ModelPrivilege
from eric.projects.tests.mixin_entity_generic_tests import EntityChangeRelatedProjectTestMixin
from eric.shared_elements.models import Meeting
from eric.shared_elements.tests.core import MeetingMixin


class TestGenericMeetings(APITestCase, EntityChangeRelatedProjectTestMixin, MeetingMixin):
    entity = Meeting

    def setUp(self):
        self.superSetUp()

        self.data = [
            {
                "title": "Telco with customer",
                "description": "<p>Some Task Description</p><p>With <b>Bold</b> Text</p>",
                "project_pks": None,
                "start_date": timezone.now(),
                "end_date": timezone.now() + timedelta(hours=1),
            },
            {
                "title": "Avengers Assemble Meeting",
                "description": "This is super important and secret. Everoyne must come. Don't tell anyone",
                "project_pks": None,
                "start_date": timezone.now(),
                "end_date": timezone.now() + timedelta(hours=1),
            },
        ]

    def test_meeting_privileges_for_attending_users(self):
        """
        Whenever a user attends a meeting, they should be able to read, edit and trash the meeting
        This is basically the same as TestGenericsTask.test_meeting_privileges_for_assigned_users just for meetings
        :return:
        """
        # create a new meeting with user1 (should work)
        response = self.rest_create_meeting(
            self.token1, HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR, **self.data[0]
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        decoded_response = json.loads(response.content.decode())
        meeting = Meeting.objects.filter(pk=decoded_response["pk"]).first()

        # query all meetings with user2 (should be zero meetings)
        response = self.rest_get_meetings(self.token2, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        decoded_list = json.loads(response.content.decode())
        decoded_list = test_utils.get_paginated_results(decoded_list)
        self.assertEqual(len(decoded_list), 0, msg="User 2 should see 0 meetings")

        # add user2 as an assigned user of the meeting
        response = self.rest_update_meeting_attending_users(
            self.token1, meeting.pk, [self.user2.pk], HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # now user2 should see the meeting
        response = self.rest_get_meetings(self.token2, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        decoded_list = json.loads(response.content.decode())
        decoded_list = test_utils.get_paginated_results(decoded_list)
        self.assertEqual(len(decoded_list), 1, msg="User 2 should see 1 meeting")

        # and there should be a view privilege listed for user 2
        response = self.rest_get_privileges(self.token1, "meetings", meeting.pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        decoded_privileges = json.loads(response.content.decode())
        self.assertEqual(len(decoded_privileges), 2, msg="There should be two privileges for this meeting")
        # privilege 0 should be for user1
        self.assertEqual(decoded_privileges[0]["user"]["pk"], self.user1.pk)
        # and privilege 1 should be for user2
        self.assertEqual(decoded_privileges[1]["user"]["pk"], self.user2.pk)
        # verify that user1 is the owner
        self.assertEqual(decoded_privileges[0]["full_access_privilege"], ModelPrivilege.ALLOW)
        # verify that user2 only has read, edit and trash access
        self.assertEqual(decoded_privileges[1]["full_access_privilege"], ModelPrivilege.NEUTRAL)
        self.assertEqual(decoded_privileges[1]["view_privilege"], ModelPrivilege.ALLOW)
        self.assertEqual(decoded_privileges[1]["edit_privilege"], ModelPrivilege.ALLOW)
        self.assertEqual(decoded_privileges[1]["trash_privilege"], ModelPrivilege.ALLOW)
        self.assertEqual(decoded_privileges[1]["delete_privilege"], ModelPrivilege.NEUTRAL)
        self.assertEqual(decoded_privileges[1]["restore_privilege"], ModelPrivilege.ALLOW)

        # now override the view_privilege for user2
        decoded_privileges[1]["view_privilege"] = ModelPrivilege.DENY
        decoded_privileges[1]["edit_privilege"] = ModelPrivilege.DENY
        decoded_privileges[1]["trash_privilege"] = ModelPrivilege.DENY
        decoded_privileges[1]["delete_privilege"] = ModelPrivilege.DENY
        decoded_privileges[1]["restore_privilege"] = ModelPrivilege.DENY
        response = self.rest_update_privilege(
            self.token1, "meetings", meeting.pk, self.user2.pk, decoded_privileges[1], HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # now user2 should not be able to see the meeting
        response = self.rest_get_meeting(self.token2, meeting.pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_create_meeting_with_wrong_time_validation_errors(self):
        """
        Tries to create a meeting where the start time is after the end time
        :return:
        """
        response = self.rest_create_meeting(
            self.token1,
            None,
            "Some Meeting Title",
            "Some Meeting Description",
            timezone.now() + timedelta(hours=1),
            timezone.now(),
            HTTP_USER_AGENT,
            REMOTE_ADDR,
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        decoded_response = json.loads(response.content.decode())
        self.assertTrue("date_time_start" in decoded_response)
        self.assertTrue("date_time_end" in decoded_response)
