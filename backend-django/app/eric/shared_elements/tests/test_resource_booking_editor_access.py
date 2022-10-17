#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from datetime import datetime

from django.contrib.auth import get_user_model
from django.utils import timezone

from rest_framework import status
from rest_framework.test import APITestCase

from eric.core.tests.test_utils import CommonTestMixin, FakeRequest, FakeRequestUser, aware_dt
from eric.model_privileges.models import ModelPrivilege
from eric.projects.models import Resource
from eric.projects.tests.core import AuthenticationMixin, ModelPrivilegeMixin
from eric.shared_elements.models import Meeting
from eric.shared_elements.tests.core import MeetingMixin, ResourceBookingMixin
from eric.versions.tests.helper_mixin import HelperMixin

User = get_user_model()
HTTP_USER_AGENT = "APITestClient"
REMOTE_ADDR = "127.0.0.1"


class EditorResourceBookingAccessTest(
    APITestCase,
    CommonTestMixin,
    HelperMixin,
    ResourceBookingMixin,
    AuthenticationMixin,
    MeetingMixin,
    ModelPrivilegeMixin,
):
    """
    Tests access and limitation to resource booking data (EditorResourceBookingViewSet).
    """

    def setUp(self):
        self.user1, self.token1 = self.create_user_and_log_in(username="user1", groups=["User"])
        self.user2, self.token2 = self.create_user_and_log_in(username="user2", groups=["User"])
        self.user3, self.token3 = self.create_user_and_log_in(username="user3", groups=["User"])
        self.user4, self.token4 = self.create_user_and_log_in(username="user4", groups=["User"])
        self.user5, self.token5 = self.create_user_and_log_in(username="user5", groups=["User"])
        self.superuser, self.superuser_token = self.create_user_and_log_in(username="superuser", is_superuser=True)

        with FakeRequest(), FakeRequestUser(self.user1):
            self.resource1 = Resource.objects.create(name="Test Resource 1", description="Test", type=Resource.ROOM)

    def assert_full_meeting_response(self, meeting, api_response):
        self.assertEqual(meeting.title, api_response.get("title"))
        self.assertEqual(str(meeting.pk), api_response.get("pk"))
        self.assertEqual(meeting.date_time_start, datetime.fromisoformat(api_response.get("date_time_start")))
        self.assertEqual(meeting.date_time_end, datetime.fromisoformat(api_response.get("date_time_end")))
        self.assertEqual(meeting.location, api_response.get("location"))
        self.assertEqual(str(meeting.resource_id), api_response.get("resource_pk"))
        self.assertEqual(meeting.text, api_response.get("text"))

    def test_full_data_for_resource_creator(self):
        # user2 creates some resource bookings
        with FakeRequest(), FakeRequestUser(self.user2):
            meeting1 = Meeting.objects.create(
                title="Meeting1",
                date_time_start=timezone.now(),
                date_time_end=timezone.now(),
                text="<h1>Lorem ipsum</h1><h2>dolor sit amet</h2>",
                location="Here",
                resource=self.resource1,
            )
            meeting2 = Meeting.objects.create(
                title="Meeting2",
                date_time_start=timezone.now(),
                date_time_end=timezone.now(),
                text="<h1>Alle meine</h1><h2>Entchen</h2>",
                location="Over there",
                resource=self.resource1,
            )

        # check that user1 can read all data
        response = self.rest_get_editor_resourcebookings(self.token1)
        parsed_response = self.parse_response(response)
        self.assertEqual(2, len(parsed_response))
        self.assert_full_meeting_response(meeting1, parsed_response[0])
        self.assert_full_meeting_response(meeting2, parsed_response[1])

    def test_no_details_for_resource_booker(self):
        # user2 creates some resource bookings
        with FakeRequest(), FakeRequestUser(self.user2):
            Meeting.objects.create(
                title="Meeting1",
                date_time_start=timezone.now(),
                date_time_end=timezone.now(),
                text="<h1>Lorem ipsum</h1><h2>dolor sit amet</h2>",
                location="Here",
                resource=self.resource1,
            )
            Meeting.objects.create(
                title="Meeting2",
                date_time_start=timezone.now(),
                date_time_end=timezone.now(),
                text="<h1>Alle meine</h1><h2>Entchen</h2>",
                location="Over there",
                resource=self.resource1,
            )

        # check that user2 can read no data here
        response = self.rest_get_editor_resourcebookings(self.token2)
        parsed_response = self.parse_response(response)
        self.assertEqual(0, len(parsed_response))

    def test_full_data_for_resource_editor_full_access(self):
        # user2 creates some resource bookings
        with FakeRequest(), FakeRequestUser(self.user2):
            meeting1 = Meeting.objects.create(
                title="Meeting1",
                date_time_start=timezone.now(),
                date_time_end=timezone.now(),
                text="<h1>Lorem ipsum</h1><h2>dolor sit amet</h2>",
                location="Here",
                resource=self.resource1,
            )
            meeting2 = Meeting.objects.create(
                title="Meeting2",
                date_time_start=timezone.now(),
                date_time_end=timezone.now(),
                text="<h1>Alle meine</h1><h2>Entchen</h2>",
                location="Over there",
                resource=self.resource1,
            )

        # create a new empty privilege for user3
        response = self.rest_create_privilege(
            self.token1, "resources", self.resource1.pk, self.user3.pk, HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # give user3 full access to user1s resource
        response = self.rest_patch_privilege(
            self.token1,
            "resources",
            self.resource1.pk,
            self.user3.pk,
            {
                "full_access_privilege": ModelPrivilege.ALLOW,
            },
            HTTP_USER_AGENT,
            REMOTE_ADDR,
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # check that user3 can read all data
        response = self.rest_get_editor_resourcebookings(self.token3)
        parsed_response = self.parse_response(response)
        self.assertEqual(2, len(parsed_response))
        self.assert_full_meeting_response(meeting1, parsed_response[0])
        self.assert_full_meeting_response(meeting2, parsed_response[1])

    def test_full_data_for_resource_editor_viewable_editable(self):
        # user2 creates some resource bookings
        with FakeRequest(), FakeRequestUser(self.user2):
            meeting1 = Meeting.objects.create(
                title="Meeting1",
                date_time_start=timezone.now(),
                date_time_end=timezone.now(),
                text="<h1>Lorem ipsum</h1><h2>dolor sit amet</h2>",
                location="Here",
                resource=self.resource1,
            )
            meeting2 = Meeting.objects.create(
                title="Meeting2",
                date_time_start=timezone.now(),
                date_time_end=timezone.now(),
                text="<h1>Alle meine</h1><h2>Entchen</h2>",
                location="Over there",
                resource=self.resource1,
            )

        # create a new empty privilege for user4
        response = self.rest_create_privilege(
            self.token1, "resources", self.resource1.pk, self.user4.pk, HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # give user4 view and edit access to user1s resource
        response = self.rest_patch_privilege(
            self.token1,
            "resources",
            self.resource1.pk,
            self.user4.pk,
            {
                "view_privilege": ModelPrivilege.ALLOW,
                "edit_privilege": ModelPrivilege.ALLOW,
            },
            HTTP_USER_AGENT,
            REMOTE_ADDR,
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # check that user4 can read all data
        response = self.rest_get_editor_resourcebookings(self.token4)
        parsed_response = self.parse_response(response)
        self.assertEqual(2, len(parsed_response))
        self.assert_full_meeting_response(meeting1, parsed_response[0])
        self.assert_full_meeting_response(meeting2, parsed_response[1])

    def test_no_data_for_resource_editor_viewable_only(self):
        # user2 creates some resource bookings
        with FakeRequest(), FakeRequestUser(self.user2):
            Meeting.objects.create(
                title="Meeting1",
                date_time_start=timezone.now(),
                date_time_end=timezone.now(),
                text="<h1>Lorem ipsum</h1><h2>dolor sit amet</h2>",
                location="Here",
                resource=self.resource1,
            )
            Meeting.objects.create(
                title="Meeting2",
                date_time_start=timezone.now(),
                date_time_end=timezone.now(),
                text="<h1>Alle meine</h1><h2>Entchen</h2>",
                location="Over there",
                resource=self.resource1,
            )

        # create a new empty privilege for user5
        response = self.rest_create_privilege(
            self.token1, "resources", self.resource1.pk, self.user5.pk, HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # give user5 view access to user1s resource
        response = self.rest_patch_privilege(
            self.token1,
            "resources",
            self.resource1.pk,
            self.user5.pk,
            {
                "view_privilege": ModelPrivilege.ALLOW,
            },
            HTTP_USER_AGENT,
            REMOTE_ADDR,
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # check that user5 can read no data
        response = self.rest_get_editor_resourcebookings(self.token5)
        parsed_response = self.parse_response(response)
        self.assertEqual(0, len(parsed_response))

    def test_full_data_for_superuser(self):
        # user2 creates some resource bookings
        with FakeRequest(), FakeRequestUser(self.user2):
            meeting1 = Meeting.objects.create(
                title="Meeting1",
                date_time_start=timezone.now(),
                date_time_end=timezone.now(),
                text="<h1>Lorem ipsum</h1><h2>dolor sit amet</h2>",
                location="Here",
                resource=self.resource1,
            )
            meeting2 = Meeting.objects.create(
                title="Meeting2",
                date_time_start=timezone.now(),
                date_time_end=timezone.now(),
                text="<h1>Alle meine</h1><h2>Entchen</h2>",
                location="Over there",
                resource=self.resource1,
            )

        # check that superuser can read all data
        response = self.rest_get_editor_resourcebookings(self.superuser_token)
        parsed_response = self.parse_response(response)
        self.assertEqual(2, len(parsed_response))
        self.assert_full_meeting_response(meeting1, parsed_response[0])
        self.assert_full_meeting_response(meeting2, parsed_response[1])
