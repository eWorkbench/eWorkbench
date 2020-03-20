#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import json

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group, Permission
from django.utils import timezone
from django.utils.timezone import timedelta
from rest_framework import status
from rest_framework.test import APITestCase

from eric.core.tests import test_utils
from eric.projects.models import Resource, ResourceBooking
from eric.projects.tests.core import AuthenticationMixin, UserMixin, ResourceMixin, \
    ResourceBookingMixin, MyResourceBookingMixin
from eric.shared_elements.models import Meeting
from eric.shared_elements.tests.core import MeetingMixin

User = get_user_model()

HTTP_USER_AGENT = "APITestClient"
REMOTE_ADDR = "127.0.0.1"

COMMON_DATA = {
    'HTTP_USER_AGENT': HTTP_USER_AGENT,
    'REMOTE_ADDR': REMOTE_ADDR,
}


class ResourceBookingsTest(APITestCase, AuthenticationMixin, UserMixin, ResourceMixin, ResourceBookingMixin,
                           MyResourceBookingMixin, MeetingMixin):
    """
    Tests the /api/resourcebookings and /api/my/resourcebookings endpoints
    Tests for creating, retrieving and updating Resourcebookings
    """

    def setUp(self):
        """ Set up a couple of users and resources and meetings """
        self.student_role = self.create_student_role()
        self.user_group = Group.objects.get(name='User')

        # get add_resource and add_resource_without_project permission
        self.add_resource_permission = Permission.objects.filter(
            codename='add_resource',
            content_type=Resource.get_content_type()
        ).first()

        self.add_resource_without_project_permission = Permission.objects.filter(
            codename='add_resource_without_project',
            content_type=Resource.get_content_type()
        ).first()

        self.user1 = User.objects.create_user(
            username='student_1', email='student_1@email.com', password='top_secret')
        self.token1 = self.login_and_return_token('student_1', 'top_secret')
        self.user1.groups.add(self.user_group)
        self.user1.user_permissions.add(self.add_resource_without_project_permission)

        self.user2 = User.objects.create_user(
            username='student_2', email='student_2@email.com', password='foobar')
        self.token2 = self.login_and_return_token('student_2', 'foobar')
        self.user2.groups.add(self.user_group)
        self.user2.user_permissions.add(self.add_resource_without_project_permission)

        self.user3 = User.objects.create_user(
            username='student_3', email='student_3@email.com', password='foobar3')
        self.token3 = self.login_and_return_token('student_3', 'foobar3')

        # Global resource
        self.resource1 = self.rest_create_resource(
            auth_token=self.token1,
            project_pks=None,
            name="Test Resource 1",
            description="Test Description",
            resource_type=Resource.ROOM,
            user_availability=Resource.GLOBAL,
            **COMMON_DATA
        )
        self.resource1 = Resource.objects.get(pk=json.loads(self.resource1.content.decode())["pk"])

        # Selected users resource, created by 2, 1 is selected
        self.resource2 = self.rest_create_resource(
            auth_token=self.token2,
            project_pks=None,
            name="Test Resource 2",
            description="Test Description",
            resource_type=Resource.ROOM,
            user_availability=Resource.SELECTED_USERS,
            user_availability_selected_user_pks=[self.user1.pk],
            **COMMON_DATA
        )
        self.resource2 = Resource.objects.get(pk=json.loads(self.resource2.content.decode())["pk"])

        # create a meeting for user 2
        self.meeting1 = self.rest_create_meeting(
            auth_token=self.token2,
            project_pks=None,
            title="Some Meeting Title",
            description="Some Meeting Description",
            start_date=timezone.now() + timedelta(hours=1),
            end_date=timezone.now() + timedelta(hours=2),
            **COMMON_DATA
        )
        self.meeting1 = Meeting.objects.get(pk=json.loads(self.meeting1.content.decode())["pk"])

        # set up valid start and end times
        self.date_time_start = timezone.now() + timedelta(hours=1)
        self.date_time_end = timezone.now() + timedelta(hours=2)
        self.minutes_after_date_time_start = self.date_time_start + timedelta(minutes=10)
        self.minutes_after_date_time_end = self.date_time_end + timedelta(minutes=10)

        # set up invalid start and end times
        self.invalid_date_time_start = timezone.now() - timedelta(hours=1)
        self.invalid_date_time_end = timezone.now() - timedelta(hours=2)

    def test_create_resourcebooking(self):
        """
        Tests creating a resourcebooking
        """
        # there should be 2 resources to begin with
        self.assertEquals(Resource.objects.all().count(), 2,
                          msg="There should be 2 Resources to begin with")

        # there should be 1 meeting to begin with
        self.assertEquals(Meeting.objects.all().count(), 1,
                          msg="There should be 1 Meetings to begin with")

        # there should be zero Resourcebookings to begin with
        self.assertEquals(ResourceBooking.objects.all().count(), 0,
                          msg="There should be zero Resourcebookings to begin with")

        # creating a resourcebooking should work for user1
        self.resourcebooking1 = self.rest_create_resourcebooking(
            auth_token=self.token1,
            date_time_start=self.date_time_start,
            date_time_end=self.date_time_end,
            resource_pk=self.resource1.pk,
            meeting_pk=None,
            comment="",
            **COMMON_DATA
        )
        self.assertEqual(self.resourcebooking1.status_code, status.HTTP_201_CREATED)

        self.assertEquals(ResourceBooking.objects.all().count(), 1, msg="There should be one resourcebooking")

        # creating a resourcebooking should work for user2 with his meeting
        self.resourcebooking2 = self.rest_create_resourcebooking(
            auth_token=self.token2,
            date_time_start=self.date_time_start,
            date_time_end=self.date_time_end,
            resource_pk=self.resource2.pk,
            meeting_pk=self.meeting1.pk,
            comment="No comment",
            **COMMON_DATA
        )
        self.assertEqual(self.resourcebooking2.status_code, status.HTTP_201_CREATED)

        self.assertEquals(ResourceBooking.objects.all().count(), 2, msg="There should be two resourcebookings")

        self.resourcebooking2 = ResourceBooking.objects.get(pk=json.loads(self.resourcebooking2.content.decode())["pk"])
        self.assertEqual(self.resourcebooking2.comment, "No comment")

    def test_update_resourcebooking(self):
        """checks if updates are applied correctly correctly"""
        # first create a booking
        self.resourcebooking1 = self.rest_create_resourcebooking(
            auth_token=self.token1,
            date_time_start=self.date_time_start,
            date_time_end=self.date_time_end,
            resource_pk=self.resource1.pk,
            meeting_pk=None,
            comment="A comment",
            **COMMON_DATA
        )
        self.assertEqual(self.resourcebooking1.status_code, status.HTTP_201_CREATED)
        self.assertEquals(ResourceBooking.objects.all().count(), 1, msg="There should be one resourcebooking")
        self.resourcebooking1 = ResourceBooking.objects.get(pk=json.loads(self.resourcebooking1.content.decode())["pk"])
        self.assertEqual(self.resourcebooking1.comment, "A comment")

        # now edit the booking
        self.resourcebooking1 = self.rest_update_resourcebooking(
            auth_token=self.token1,
            resourcebooking_pk=self.resourcebooking1.pk,
            date_time_start=self.date_time_start,
            date_time_end=self.date_time_end,
            resource_pk=self.resource1.pk,
            meeting_pk=self.meeting1.pk,
            comment="A different comment",
            **COMMON_DATA
        )
        self.assertEqual(self.resourcebooking1.status_code, status.HTTP_200_OK)
        self.assertEquals(ResourceBooking.objects.all().count(), 1, msg="There should be one resourcebooking")
        self.resourcebooking1 = ResourceBooking.objects.get(pk=json.loads(self.resourcebooking1.content.decode())["pk"])
        self.assertEqual(self.resourcebooking1.meeting, self.meeting1)
        self.assertEqual(self.resourcebooking1.comment, "A different comment")

    def test_delete_resourcebooking(self):
        """checks if bookings are deleted correctly"""
        # first create two bookings
        self.resourcebooking1 = self.rest_create_resourcebooking(
            auth_token=self.token1,
            date_time_start=self.date_time_start,
            date_time_end=self.date_time_end,
            resource_pk=self.resource1.pk,
            meeting_pk=None,
            comment="A comment",
            **COMMON_DATA
        )
        self.assertEqual(self.resourcebooking1.status_code, status.HTTP_201_CREATED)
        self.assertEquals(ResourceBooking.objects.all().count(), 1, msg="There should be one resourcebooking")

        self.resourcebooking2 = self.rest_create_resourcebooking(
            auth_token=self.token2,
            date_time_start=self.date_time_start,
            date_time_end=self.date_time_end,
            resource_pk=self.resource2.pk,
            meeting_pk=self.meeting1.pk,
            comment="Another comment",
            **COMMON_DATA
        )
        self.assertEqual(self.resourcebooking1.status_code, status.HTTP_201_CREATED)
        self.assertEquals(ResourceBooking.objects.all().count(), 2, msg="There should be two resourcebookings")

        # get booking 1
        self.resourcebooking1 = ResourceBooking.objects.get(pk=json.loads(self.resourcebooking1.content.decode())["pk"])
        # delete it
        self.resourcebooking1 = self.rest_delete_resourcebooking(
            auth_token=self.token1,
            resourcebooking_pk=self.resourcebooking1.pk,
            **COMMON_DATA
        )
        self.assertEqual(self.resourcebooking1.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEquals(ResourceBooking.objects.all().count(), 1, msg="There should be one resourcebooking")

    def test_resourcebooking_validation(self):
        # test date_time_start in the past
        response = self.rest_create_resourcebooking(
            auth_token=self.token1,
            date_time_start=self.invalid_date_time_start,
            date_time_end=self.date_time_end,
            resource_pk=self.resource1.pk,
            meeting_pk=None,
            comment="A comment",
            **COMMON_DATA
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(json.loads(response.content.decode())["date_time_start"][0],
                         'Start date must not be in the past')
        self.assertEquals(ResourceBooking.objects.all().count(), 0, msg="There should be zero resourcebookings")

        # test date_time_end before date_time_start
        response = self.rest_create_resourcebooking(
            auth_token=self.token1,
            date_time_start=self.date_time_start,
            date_time_end=self.invalid_date_time_end,
            resource_pk=self.resource1.pk,
            meeting_pk=None,
            comment="A comment",
            **COMMON_DATA
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(json.loads(response.content.decode())["date_time_start"][0],
                         'Start date must be before end date')
        self.assertEqual(json.loads(response.content.decode())["date_time_end"][0],
                         'End date must be after start date')
        self.assertEquals(ResourceBooking.objects.all().count(), 0, msg="There should be zero resourcebookings")

        # test booking overlap
        self.resourcebooking1 = self.rest_create_resourcebooking(
            auth_token=self.token1,
            date_time_start=self.date_time_start,
            date_time_end=self.date_time_end,
            resource_pk=self.resource1.pk,
            meeting_pk=None,
            comment="A comment",
            **COMMON_DATA
        )
        self.assertEqual(self.resourcebooking1.status_code, status.HTTP_201_CREATED)
        self.assertEquals(ResourceBooking.objects.all().count(), 1, msg="There should be one resourcebooking")

        response = self.rest_create_resourcebooking(
            auth_token=self.token2,
            date_time_start=self.minutes_after_date_time_start,
            date_time_end=self.minutes_after_date_time_end,
            resource_pk=self.resource1.pk,
            meeting_pk=None,
            comment="A comment",
            **COMMON_DATA
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(json.loads(response.content.decode())["date_time_start"][0],
                         'This resource is already booked at this time')
        self.assertEqual(json.loads(response.content.decode())["date_time_end"][0],
                         'This resource is already booked at this time')
        self.assertEquals(ResourceBooking.objects.all().count(), 1, msg="There should be one resourcebooking")

    def test_my_resourcebookings(self):
        # creating 3 resourcebookings for user1
        response = self.rest_create_resourcebooking(
            auth_token=self.token1,
            date_time_start=self.date_time_start,
            date_time_end=self.date_time_end,
            resource_pk=self.resource1.pk,
            meeting_pk=None,
            comment="",
            **COMMON_DATA
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEquals(ResourceBooking.objects.all().count(), 1, msg="There should be one resourcebooking")
        response = self.rest_create_resourcebooking(
            auth_token=self.token1,
            date_time_start=self.date_time_start + timedelta(hours=2),
            date_time_end=self.date_time_end + timedelta(hours=2),
            resource_pk=self.resource1.pk,
            meeting_pk=None,
            comment="",
            **COMMON_DATA
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEquals(ResourceBooking.objects.all().count(), 2, msg="There should be two resourcebooking")
        response = self.rest_create_resourcebooking(
            auth_token=self.token1,
            date_time_start=self.date_time_start + timedelta(hours=4),
            date_time_end=self.date_time_end + timedelta(hours=4),
            resource_pk=self.resource1.pk,
            meeting_pk=None,
            comment="",
            **COMMON_DATA
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEquals(ResourceBooking.objects.all().count(), 3, msg="There should be three resourcebooking")

        # creating 2 resourcebookings for user2
        response = self.rest_create_resourcebooking(
            auth_token=self.token2,
            date_time_start=self.date_time_start,
            date_time_end=self.date_time_end,
            resource_pk=self.resource2.pk,
            meeting_pk=self.meeting1.pk,
            comment="No comment",
            **COMMON_DATA
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        # 2 total bookings
        self.assertEquals(ResourceBooking.objects.all().count(), 4, msg="There should be four resourcebookings")
        response = self.rest_create_resourcebooking(
            auth_token=self.token2,
            date_time_start=self.date_time_start + timedelta(hours=2),
            date_time_end=self.date_time_end + timedelta(hours=2),
            resource_pk=self.resource2.pk,
            meeting_pk=self.meeting1.pk,
            comment="No comment",
            **COMMON_DATA
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        # 2 total bookings
        self.assertEquals(ResourceBooking.objects.all().count(), 5, msg="There should be five resourcebookings")

        # now let's check that user1 gets his 3 bookings
        response = self.rest_get_my_resourcebookings(
            auth_token=self.token1,
            **COMMON_DATA
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(test_utils.get_paginated_results(json.loads(response.content.decode()))), 3)

        # and user2 gets his 2
        response = self.rest_get_my_resourcebookings(
            auth_token=self.token2,
            **COMMON_DATA
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(test_utils.get_paginated_results(json.loads(response.content.decode()))), 2)
