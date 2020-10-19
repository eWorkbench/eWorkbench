#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import calendar
import json
from datetime import datetime

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group, Permission
from django.utils import timezone
from django.utils.timezone import timedelta, localtime
from rest_framework import status
from rest_framework.test import APITestCase

from eric.core.tests import HTTP_INFO
from eric.core.tests.test_utils import CommonTestMixin
from eric.projects.models import Resource
from eric.projects.models import ResourceBookingRuleMinimumDuration, ResourceBookingRuleMaximumDuration, \
    ResourceBookingRuleBookableHours, ResourceBookingRuleMinimumTimeBefore, ResourceBookingRuleMaximumTimeBefore, \
    ResourceBookingRuleTimeBetween, ResourceBookingRuleBookingsPerUser
from eric.projects.tests.core import AuthenticationMixin, UserMixin, ResourceMixin
from eric.shared_elements.models import Meeting
from eric.shared_elements.tests.core import MeetingMixin

User = get_user_model()


class ResourceBookingsTest(APITestCase, CommonTestMixin, AuthenticationMixin, UserMixin, ResourceMixin, MeetingMixin):
    """
    Tests the /api/resourcebookings and /api/my/resourcebookings endpoints
    Tests for creating, retrieving and updating Resourcebookings
    """

    @staticmethod
    def get_date_for_next_weekday(current_date, next_weekday, skip_current_week=False):
        """
        Calculates the correct date for the next desired weekday
        :param current_date: Date to start the calculation from
        :param next_weekday: Integer value representing the desired next weekday (Monday = 0, Tuesday = 1, ...)
        :param skip_current_week: Skips the occurrence of the weekday for the current week and adds another 7 days
        :return: Date of the next desired weekday
        """
        days_to_come = next_weekday - current_date.weekday()
        if skip_current_week and days_to_come <= 0:
            days_to_come += 7
        return current_date + timedelta(days_to_come)

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

        # Global resource
        self.resource1 = self.rest_create_resource(
            auth_token=self.token1,
            project_pks=None,
            name="Test Resource 1",
            description="Test Description",
            resource_type=Resource.ROOM,
            user_availability=Resource.GLOBAL,
            **HTTP_INFO
        )
        self.resource1 = Resource.objects.get(pk=json.loads(self.resource1.content.decode())["pk"])

        # set up start and end times
        self.now = localtime(timezone.now())
        self.date_time_start = self.now + timedelta(hours=1)
        self.date_time_end_30_minutes = self.now + timedelta(hours=1) + timedelta(minutes=30)
        self.date_time_end_1_hour = self.now + timedelta(hours=2)
        self.date_time_end_2_hours = self.now + timedelta(hours=3)
        self.date_time_next_monday = self.get_date_for_next_weekday(self.now + timedelta(days=7), 0)
        self.days_in_this_month = calendar.monthrange(self.now.year, self.now.month)[1]
        self.first_day_of_this_month = datetime(self.now.year, self.now.month, 1)
        self.first_day_of_next_month = self.first_day_of_this_month + timedelta(days=self.days_in_this_month)
        self.days_in_next_month = calendar.monthrange(self.first_day_of_next_month.year,
                                                      self.first_day_of_next_month.month)[1]
        self.first_day_of_next_next_month = self.first_day_of_next_month + timedelta(days=self.days_in_next_month)
        self.date_time_start_next_monday_08 = self.date_time_next_monday.replace(
            hour=8,
            minute=00,
            second=00,
            microsecond=00,
        )
        self.date_time_start_next_monday_09 = self.date_time_next_monday.replace(
            hour=9,
            minute=00,
            second=00,
            microsecond=00,
        )
        self.date_time_end_next_monday_14 = self.date_time_next_monday.replace(
            hour=14,
            minute=00,
            second=00,
            microsecond=00,
        )
        self.date_time_end_next_monday_16 = self.date_time_next_monday.replace(
            hour=16,
            minute=00,
            second=00,
            microsecond=00,
        )
        self.date_time_next_tuesday = self.get_date_for_next_weekday(self.now + timedelta(days=7), 1)
        self.date_time_start_next_tuesday_09 = self.date_time_next_tuesday.replace(
            hour=9,
            minute=00,
            second=00,
            microsecond=00,
        )
        self.date_time_end_next_tuesday_14 = self.date_time_next_tuesday.replace(
            hour=14,
            minute=00,
            second=00,
            microsecond=00,
        )
        self.date_time_next_wednesday = self.get_date_for_next_weekday(self.now + timedelta(days=7), 2)
        self.date_time_start_next_wednesday_08 = self.date_time_next_wednesday.replace(
            hour=8,
            minute=00,
            second=00,
            microsecond=00,
        )
        self.date_time_start_next_wednesday_09 = self.date_time_next_wednesday.replace(
            hour=9,
            minute=00,
            second=00,
            microsecond=00,
        )
        self.date_time_start_next_wednesday_12 = self.date_time_next_wednesday.replace(
            hour=12,
            minute=00,
            second=00,
            microsecond=00,
        )
        self.date_time_end_next_wednesday_14 = self.date_time_next_wednesday.replace(
            hour=14,
            minute=00,
            second=00,
            microsecond=00,
        )
        self.date_time_end_next_wednesday_16 = self.date_time_next_wednesday.replace(
            hour=16,
            minute=00,
            second=00,
            microsecond=00,
        )
        self.date_time_next_friday = self.get_date_for_next_weekday(self.now + timedelta(days=7), 4)
        self.date_time_start_next_friday_08 = self.date_time_next_friday.replace(
            hour=8,
            minute=00,
            second=00,
            microsecond=00,
        )
        self.date_time_start_next_friday_09 = self.date_time_next_friday.replace(
            hour=9,
            minute=00,
            second=00,
            microsecond=00,
        )
        self.date_time_end_next_friday_14 = self.date_time_next_friday.replace(
            hour=14,
            minute=00,
            second=00,
            microsecond=00,
        )
        self.date_time_end_next_friday_16 = self.date_time_next_friday.replace(
            hour=16,
            minute=00,
            second=00,
            microsecond=00,
        )

    def test_resourcebooking_validate_booking_rule_minimum_duration(self):
        ResourceBookingRuleMinimumDuration.objects.create(
            duration="01:00:00",
            resource=self.resource1,
        )
        # test duration not long enough
        response = self.rest_create_resource_booking(
            auth_token=self.token1,
            title='Appointment',
            date_time_start=self.date_time_start,
            date_time_end=self.date_time_end_30_minutes,
            resource_pk=self.resource1.pk,
            **HTTP_INFO
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(json.loads(response.content.decode())["resource"][0],
                         'This resource has a minimum booking duration of 1:00 hours')
        self.assertEquals(Meeting.objects.all().count(), 0, msg="There should be zero resourcebookings")

        # test duration ok
        response = self.rest_create_resource_booking(
            auth_token=self.token1,
            title='Appointment',
            date_time_start=self.date_time_start,
            date_time_end=self.date_time_end_1_hour,
            resource_pk=self.resource1.pk,
            **HTTP_INFO
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEquals(Meeting.objects.all().count(), 1, msg="There should be one resourcebooking")

    def test_resourcebooking_validate_booking_rule_maximum_duration(self):
        ResourceBookingRuleMaximumDuration.objects.create(
            duration="01:00:00",
            resource=self.resource1,
        )
        # test duration too long
        response = self.rest_create_resource_booking(
            auth_token=self.token1,
            title='Appointment',
            date_time_start=self.date_time_start,
            date_time_end=self.date_time_end_2_hours,
            resource_pk=self.resource1.pk,
            **HTTP_INFO
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(json.loads(response.content.decode())["resource"][0],
                         'This resource has a maximum booking duration of 1:00 hours')
        self.assertEquals(Meeting.objects.all().count(), 0, msg="There should be zero resourcebookings")

        # test duration ok
        response = self.rest_create_resource_booking(
            auth_token=self.token1,
            title='Appointment',
            date_time_start=self.date_time_start,
            date_time_end=self.date_time_end_30_minutes,
            resource_pk=self.resource1.pk,
            **HTTP_INFO
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEquals(Meeting.objects.all().count(), 1, msg="There should be one resourcebooking")

    def test_resourcebooking_validate_booking_rule_bookable_hours(self):
        ResourceBookingRuleBookableHours.objects.create(
            monday=True,
            tuesday=False,
            wednesday=True,
            thursday=True,
            friday=True,
            saturday=False,
            sunday=False,
            time_start="09:00:00",
            time_end="15:00:00",
            resource=self.resource1,
        )

        # date outside bookable hours
        response = self.rest_create_resource_booking(
            auth_token=self.token1,
            title='Appointment',
            date_time_start=self.date_time_start_next_tuesday_09,
            date_time_end=self.date_time_end_next_tuesday_14,
            resource_pk=self.resource1.pk,
            **HTTP_INFO
        )
        self.assert_response_status(response, expected_status_code=status.HTTP_400_BAD_REQUEST)
        self.assertEqual(json.loads(response.content.decode())["resource"][0],
                         'This resource cannot be booked on this day')
        self.assertEquals(Meeting.objects.all().count(), 0, msg="There should be zero resourcebookings")

        # time outside bookable hours
        response = self.rest_create_resource_booking(
            auth_token=self.token1,
            title='Appointment',
            date_time_start=self.date_time_start_next_wednesday_12,
            date_time_end=self.date_time_end_next_wednesday_16,
            resource_pk=self.resource1.pk,
            **HTTP_INFO
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(json.loads(response.content.decode())["resource"][0],
                         'The end time is outside the bookable times')
        self.assertEquals(Meeting.objects.all().count(), 0, msg="There should be zero resourcebookings")

        # day between bookable hours
        response = self.rest_create_resource_booking(
            auth_token=self.token1,
            title='Appointment',
            date_time_start=self.date_time_start_next_monday_09,
            date_time_end=self.date_time_end_next_wednesday_14,
            resource_pk=self.resource1.pk,
            **HTTP_INFO
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(json.loads(response.content.decode())["resource"][0],
                         'There are days between the start date and the end date that are not bookable '
                         'for this resource')
        self.assertEquals(Meeting.objects.all().count(), 0, msg="There should be zero resourcebookings")

        # time between bookable hours
        response = self.rest_create_resource_booking(
            auth_token=self.token1,
            title='Appointment',
            date_time_start=self.date_time_end_next_wednesday_14,
            date_time_end=self.date_time_end_next_friday_14,
            resource_pk=self.resource1.pk,
            **HTTP_INFO
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(json.loads(response.content.decode())["resource"][0],
                         'There are times between the start date and the end date that are not bookable '
                         'for this resource')
        self.assertEquals(Meeting.objects.all().count(), 0, msg="There should be zero resourcebookings")

        # test bookable hours ok
        response = self.rest_create_resource_booking(
            auth_token=self.token1,
            title='Appointment',
            date_time_start=self.date_time_start_next_monday_09,
            date_time_end=self.date_time_end_next_monday_14,
            resource_pk=self.resource1.pk,
            **HTTP_INFO
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEquals(Meeting.objects.all().count(), 1, msg="There should be one resourcebooking")

    def test_resourcebooking_validate_booking_rule_minimum_time_before(self):
        ResourceBookingRuleMinimumTimeBefore.objects.create(
            duration="01:00:00",
            resource=self.resource1,
        )

        # not enough time before
        response = self.rest_create_resource_booking(
            auth_token=self.token1,
            title='Appointment',
            date_time_start=self.now + timedelta(minutes=10),
            date_time_end=self.date_time_end_2_hours,
            resource_pk=self.resource1.pk,
            **HTTP_INFO
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(json.loads(response.content.decode())["resource"][0],
                         'This resource must be booked at least 1:00 hours in advance')
        self.assertEquals(Meeting.objects.all().count(), 0, msg="There should be zero resourcebookings")

        # enough time before
        response = self.rest_create_resource_booking(
            auth_token=self.token1,
            title='Appointment',
            date_time_start=self.now + timedelta(hours=1) + timedelta(minutes=10),
            date_time_end=self.date_time_end_2_hours,
            resource_pk=self.resource1.pk,
            **HTTP_INFO
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEquals(Meeting.objects.all().count(), 1, msg="There should be one resourcebooking")

    def test_resourcebooking_validate_booking_rule_maximum_time_before(self):
        ResourceBookingRuleMaximumTimeBefore.objects.create(
            duration="14 01:00:00",
            resource=self.resource1,
        )

        # booking too far ahead
        response = self.rest_create_resource_booking(
            auth_token=self.token1,
            title='Appointment',
            date_time_start=self.now + timedelta(days=14) + timedelta(hours=2),
            date_time_end=self.now + timedelta(days=14) + timedelta(hours=3),
            resource_pk=self.resource1.pk,
            **HTTP_INFO
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(json.loads(response.content.decode())["resource"][0],
                         'This resource cannot be booked more than 14 days, 1:00 hours in advance')
        self.assertEquals(Meeting.objects.all().count(), 0, msg="There should be zero resourcebookings")

        # booking within the timeframe
        response = self.rest_create_resource_booking(
            auth_token=self.token1,
            title='Appointment',
            date_time_start=self.now + timedelta(days=7),
            date_time_end=self.now + timedelta(days=7) + timedelta(hours=1),
            resource_pk=self.resource1.pk,
            **HTTP_INFO
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEquals(Meeting.objects.all().count(), 1, msg="There should be one resourcebooking")

    def test_resourcebooking_validate_booking_rule_time_between(self):
        ResourceBookingRuleTimeBetween.objects.create(
            duration="02:00:00",
            resource=self.resource1,
        )

        # set one booking up first
        response = self.rest_create_resource_booking(
            auth_token=self.token1,
            title='Appointment',
            date_time_start=self.now + timedelta(minutes=10),
            date_time_end=self.date_time_end_2_hours,
            resource_pk=self.resource1.pk,
            **HTTP_INFO
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEquals(Meeting.objects.all().count(), 1, msg="There should be one resourcebooking")

        # not enough time between
        response = self.rest_create_resource_booking(
            auth_token=self.token1,
            title='Appointment',
            date_time_start=self.date_time_end_2_hours + timedelta(hours=1),
            date_time_end=self.date_time_end_2_hours + timedelta(hours=5),
            resource_pk=self.resource1.pk,
            **HTTP_INFO
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(json.loads(response.content.decode())["resource"][0],
                         'This resource needs at least 2:00 hours between bookings')
        self.assertEquals(Meeting.objects.all().count(), 1, msg="There should be one resourcebooking")

        # enough time between
        response = self.rest_create_resource_booking(
            auth_token=self.token1,
            title='Appointment',
            date_time_start=self.date_time_end_2_hours + timedelta(hours=2) + timedelta(minutes=10),
            date_time_end=self.date_time_end_2_hours + timedelta(hours=5),
            resource_pk=self.resource1.pk,
            **HTTP_INFO
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEquals(Meeting.objects.all().count(), 2, msg="There should be two resourcebookings")

    def test_resourcebooking_validate_booking_rule_bookings_per_user(self):
        ResourceBookingRuleBookingsPerUser.objects.create(
            count=2,
            unit='DAY',
            resource=self.resource1,
        )

        ResourceBookingRuleBookingsPerUser.objects.create(
            count=3,
            unit='WEEK',
            resource=self.resource1,
        )

        ResourceBookingRuleBookingsPerUser.objects.create(
            count=4,
            unit='MONTH',
            resource=self.resource1,
        )

        # set one booking up first
        response = self.rest_create_resource_booking(
            auth_token=self.token1,
            title='Appointment',
            date_time_start=self.date_time_start_next_monday_08,
            date_time_end=self.date_time_start_next_monday_08 + timedelta(hours=1),
            resource_pk=self.resource1.pk,
            **HTTP_INFO
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEquals(Meeting.objects.all().count(), 1, msg="There should be one resourcebooking")

        # set another booking up for this day
        response = self.rest_create_resource_booking(
            auth_token=self.token1,
            title='Appointment',
            date_time_start=self.date_time_start_next_monday_08 + timedelta(hours=3),
            date_time_end=self.date_time_start_next_monday_08 + timedelta(hours=4),
            resource_pk=self.resource1.pk,
            **HTTP_INFO
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEquals(Meeting.objects.all().count(), 2, msg="There should be two resourcebookings")

        # a third booking for this day shouldn't be possible
        response = self.rest_create_resource_booking(
            auth_token=self.token1,
            title='Appointment',
            date_time_start=self.date_time_start_next_monday_08 + timedelta(hours=6),
            date_time_end=self.date_time_start_next_monday_08 + timedelta(hours=7),
            resource_pk=self.resource1.pk,
            **HTTP_INFO
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(json.loads(response.content.decode())["resource"][0],
                         'You have reached the maximum amount of bookings for this resource for this day')
        self.assertEquals(Meeting.objects.all().count(), 2, msg="There should be two resourcebookings")

        # set another booking up for another day within this week
        response = self.rest_create_resource_booking(
            auth_token=self.token1,
            title='Appointment',
            date_time_start=self.date_time_start_next_tuesday_09,
            date_time_end=self.date_time_start_next_tuesday_09 + timedelta(hours=1),
            resource_pk=self.resource1.pk,
            **HTTP_INFO
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEquals(Meeting.objects.all().count(), 3, msg="There should be three resourcebookings")

        # another booking for this week shouldn't be possible
        response = self.rest_create_resource_booking(
            auth_token=self.token1,
            title='Appointment',
            date_time_start=self.date_time_start_next_wednesday_09,
            date_time_end=self.date_time_start_next_wednesday_09 + timedelta(hours=1),
            resource_pk=self.resource1.pk,
            **HTTP_INFO
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(json.loads(response.content.decode())["resource"][0],
                         'You have reached the maximum amount of bookings for this resource for this week')
        self.assertEquals(Meeting.objects.all().count(), 3, msg="There should be three resourcebookings")

        # set a 1st booking up for another day within the month 2 months from now
        response = self.rest_create_resource_booking(
            auth_token=self.token1,
            title='Appointment',
            date_time_start=self.first_day_of_next_next_month + timedelta(days=1) + timedelta(hours=1),
            date_time_end=self.first_day_of_next_next_month + timedelta(days=1) + timedelta(hours=2),
            resource_pk=self.resource1.pk,
            **HTTP_INFO
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEquals(Meeting.objects.all().count(), 4, msg="There should be four resourcebookings")

        # set a 2nd booking up for another day within the month 2 months from now
        response = self.rest_create_resource_booking(
            auth_token=self.token1,
            title='Appointment',
            date_time_start=self.first_day_of_next_next_month + timedelta(days=4) + timedelta(hours=1),
            date_time_end=self.first_day_of_next_next_month + timedelta(days=4) + timedelta(hours=2),
            resource_pk=self.resource1.pk,
            **HTTP_INFO
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEquals(Meeting.objects.all().count(), 5, msg="There should be four resourcebookings")

        # set a 3rd booking up for another day within the month 2 months from now
        response = self.rest_create_resource_booking(
            auth_token=self.token1,
            title='Appointment',
            date_time_start=self.first_day_of_next_next_month + timedelta(days=8) + timedelta(hours=1),
            date_time_end=self.first_day_of_next_next_month + timedelta(days=8) + timedelta(hours=2),
            resource_pk=self.resource1.pk,
            **HTTP_INFO
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEquals(Meeting.objects.all().count(), 6, msg="There should be four resourcebookings")

        # set a 4th and last booking up for another day within the month 2 months from now
        response = self.rest_create_resource_booking(
            auth_token=self.token1,
            title='Appointment',
            date_time_start=self.first_day_of_next_next_month + timedelta(days=14) + timedelta(hours=1),
            date_time_end=self.first_day_of_next_next_month + timedelta(days=14) + timedelta(hours=2),
            resource_pk=self.resource1.pk,
            **HTTP_INFO
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEquals(Meeting.objects.all().count(), 7, msg="There should be four resourcebookings")

        # a 5th booking for the month 2 months from now shouldn't be possible
        response = self.rest_create_resource_booking(
            auth_token=self.token1,
            title='Appointment',
            date_time_start=self.first_day_of_next_next_month + timedelta(days=20) + timedelta(hours=1),
            date_time_end=self.first_day_of_next_next_month + timedelta(days=20) + timedelta(hours=2),
            resource_pk=self.resource1.pk,
            **HTTP_INFO
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(json.loads(response.content.decode())["resource"][0],
                         'You have reached the maximum amount of bookings for this resource for this month')
        self.assertEquals(Meeting.objects.all().count(), 7, msg="There should be four resourcebookings")
