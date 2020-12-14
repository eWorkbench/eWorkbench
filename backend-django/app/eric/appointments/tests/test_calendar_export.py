#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from datetime import timedelta

import time_machine
from django.core.cache import cache
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from eric.appointments.tests.core import ResourceBookingCalendarExportMixin
from eric.core.tests.test_utils import CommonTestMixin
from eric.projects.models import Resource
from eric.projects.tests.core import ResourceMixin
from eric.shared_elements.tests.core import MeetingMixin

HEADERS_STR = 'appointment_id;resource_name;start;end'
LINE_BREAK = '\r\n'


class CalendarExportTest(APITestCase, CommonTestMixin, ResourceBookingCalendarExportMixin, MeetingMixin, ResourceMixin):
    def setUp(self):
        # clear cache for every test case
        cache.clear()

        # create a user
        self.superuser, self.superuser_token = self.create_user_and_log_in(username='superuser', is_superuser=True)

        # create some resources
        self.resource1 = self.create_resource(name='First "Resource"', study_room=True)
        self.resource2 = self.create_resource(name='Second, Resource', study_room=True)
        self.resource3 = self.create_resource(name='Third; Resource', study_room=True)

    def test_headers_only_for_no_bookings(self):
        response = self.rest_get_resource_booking_calendar_export()
        self.assert_response_status(response, status.HTTP_200_OK)
        self.assertEquals(HEADERS_STR, response.content.decode().strip())

    def test_headers_only_for_no_bookings_within_the_next_two_weeks(self):
        # create bookings in the past
        now = timezone.now()
        start_of_today = now.replace(hour=0, minute=0, second=0, microsecond=0)
        self.create_booking(
            self.resource1,
            start=now - timedelta(days=3),
            end=now - timedelta(days=1)
        )
        self.create_booking(
            self.resource2,
            start=now - timedelta(days=2),
            end=start_of_today - timedelta(hours=3)
        )

        # create bookings in the future
        self.create_booking(
            self.resource1,
            start=now + timedelta(days=15),
            end=now + timedelta(days=16)
        )
        self.create_booking(
            self.resource2,
            start=now + timedelta(days=14) + timedelta(hours=3),
            end=now + timedelta(days=16)
        )

        # check response
        response = self.rest_get_resource_booking_calendar_export()
        self.assert_response_status(response, status.HTTP_200_OK)
        self.assertEquals(HEADERS_STR, response.content.decode().strip())

    @time_machine.travel('2020-10-30 10:00:00', tz_offset=timedelta(hours=1), tick=False)
    def test_csv_export_data(self):
        """
        Tests the exported CSV data.
        Requirements:
        * Required data: Appointment ID, Resource name, Start, End
        * timestamps in ISO format
        * All data must be anonymous (no appointment title, user name, etc.)
        * Resource names must be escaped to allow CSV parsing
        """

        now = timezone.now()

        # booking end within next two weeks
        booking1 = self.create_booking(
            self.resource1,
            start=now - timedelta(days=3),
            end=now + timedelta(hours=1)
        )

        # full booking within next two weeks
        booking2 = self.create_booking(
            self.resource2,
            start=now,
            end=now + timedelta(days=1)
        )

        # start within next two weeks
        booking3 = self.create_booking(
            self.resource2,
            start=now + timedelta(days=13),
            end=now + timedelta(days=17)
        )
        booking4 = self.create_booking(  # same time, different resource
            self.resource3,
            start=now + timedelta(days=13),
            end=now + timedelta(days=17)
        )

        # check response
        response = self.rest_get_resource_booking_calendar_export()
        self.assert_response_status(response, status.HTTP_200_OK)

        expected_content = \
            HEADERS_STR + LINE_BREAK \
            + f'{booking1.pk};"First ""Resource""";2020-10-27T10:00:00+00:00;2020-10-30T11:00:00+00:00' + LINE_BREAK \
            + f'{booking2.pk};Second, Resource;2020-10-30T10:00:00+00:00;2020-10-31T10:00:00+00:00' + LINE_BREAK \
            + f'{booking3.pk};Second, Resource;2020-11-12T10:00:00+00:00;2020-11-16T10:00:00+00:00' + LINE_BREAK \
            + f'{booking4.pk};"Third; Resource";2020-11-12T10:00:00+00:00;2020-11-16T10:00:00+00:00' + LINE_BREAK

        response_content = response.content.decode()
        print("--- Actual Response ---")
        print(response_content)
        print("--- End Actual Response ---")

        self.maxDiff = None  # no diff limit for error output
        self.assertEquals(expected_content, response_content)

    def test_only_study_room_bookings_are_exported(self):
        microscope = self.create_resource(name="Microscope", resource_type=Resource.LAB_EQUIPMENT, study_room=False)
        office_room = self.create_resource(name="Office Room #123", resource_type=Resource.ROOM, study_room=False)
        notebook = self.create_resource(name="Notebook", resource_type=Resource.IT_RESOURCE, study_room=False)
        chair = self.create_resource(name="Office Chair", resource_type=Resource.OFFICE_EQUIPMENT, study_room=False)

        # create bookings
        now = timezone.now()
        self.create_booking(microscope, start=now, end=now + timedelta(days=14))
        self.create_booking(office_room, start=now, end=now + timedelta(days=14))
        self.create_booking(notebook, start=now, end=now + timedelta(days=14))
        self.create_booking(chair, start=now, end=now + timedelta(days=14))

        # check that response consists only of the CSV headers
        response = self.rest_get_resource_booking_calendar_export()
        self.assert_response_status(response, status.HTTP_200_OK)
        self.assertEquals(HEADERS_STR, response.content.decode().strip())

    def create_booking(self, resource, start, end):
        booking, response = self.create_meeting_orm(
            self.superuser_token, project_pk=None,
            title='Booking', description='Test Description',
            start_date=start, end_date=end,
            resource_pk=resource.pk,
        )
        self.assert_response_status(response, status.HTTP_201_CREATED)
        self.assertIsNotNone(booking.resource)
        return booking

    def create_resource(self, name, resource_type=Resource.ROOM, study_room=True):
        data = {
            'auth_token': self.superuser_token,
            'project_pks': None,
            'name': name,
            'description': 'Resource Description',
            'resource_type': resource_type,
            'user_availability': Resource.GLOBAL,
            'study_room': study_room,
        }

        if data.get('study_room', False) and not data.get('branch_library', False):
            data['branch_library'] = Resource.MAIN_CAMPUS

        resource, response = self.create_resource_orm(**data)
        self.assert_response_status(response, status.HTTP_201_CREATED)
        return resource
