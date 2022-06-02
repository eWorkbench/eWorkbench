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

from eric.appointments.tests.core import StudyRoomExportMixin
from eric.core.tests.test_utils import CommonTestMixin
from eric.projects.models import Resource
from eric.projects.tests.core import ResourceMixin
from eric.shared_elements.tests.core import MeetingMixin
from eric.site_preferences.models import options as site_preferences

LINE_BREAK = '\r\n'
ROOM_ID = 'RaumId'
ROOM_NAME = 'Raumbezeichnung'
EVENT_START = 'TerminStart'
EVENT_END = 'TerminEnde'
ONGOING = 'Laufend'
EVENT_NAME = 'TerminBezeichnung'
ORGANISER = 'Organisator'
EVENT_DATE = 'TerminDatum'
DATE = 'Datum'
TEMPLATE = 'Template'


class DisplayExportTest(APITestCase, CommonTestMixin, StudyRoomExportMixin, MeetingMixin, ResourceMixin):
    def setUp(self):
        # avoid cached responses
        cache.clear()

        # create a user to create resources and bookings
        # (but query exports as anonymous)
        self.superuser, self.superuser_token = self.create_user_and_log_in(username='superuser', is_superuser=True)
        self.superuser.userprofile.last_name = 'Superuser'
        self.superuser.userprofile.save()

        # print full assertion diffs
        self.maxDiff = None

        self.default_design = self.get_display_design('Default')

    def test_only_headers_are_exported_if_there_are_no_study_rooms(self):
        """
        Tests that the export contains headers only, if there are no study rooms.
        Tests that bookings of standard resources are not exported.
        """
        site_preferences.bookings_per_room_in_study_room_booking_display_export = 2
        token = self.superuser_token

        # create some non-study-room resources
        class_room = self.create_resource(token, 'Class Room', resource_type=Resource.ROOM)
        self.create_resource(token, 'Microscope', resource_type=Resource.LAB_EQUIPMENT)
        self.create_resource(token, 'Stapler', resource_type=Resource.OFFICE_EQUIPMENT)
        self.create_resource(token, 'Computer', resource_type=Resource.IT_RESOURCE)

        # book standard resources (non-study-rooms)
        now = timezone.now()
        tomorrow = now + timedelta(days=1)
        self.create_booking(token, resource=class_room, start=now, end=tomorrow)

        response = self.rest_get_study_room_display_export()
        self.assert_response_status(response, status.HTTP_200_OK)
        self.assertEquals(
            f'{ROOM_ID};{ROOM_NAME};' +
            f'{EVENT_START}01;{EVENT_END}01;{ONGOING}01;{EVENT_NAME}01;{ORGANISER}01;{EVENT_DATE}01;' +
            f'{EVENT_START}02;{EVENT_END}02;{ONGOING}02;{EVENT_NAME}02;{ORGANISER}02;{EVENT_DATE}02;' +
            f'{DATE};{TEMPLATE}',
            response.content.decode().strip()
        )

    @time_machine.travel('2020-12-02 13:00')
    def test_that_there_are_empty_cells_if_there_are_not_enough_bookings(self):
        """
        Tests that empty cells will be exported, if there are no/not enough bookings for study rooms.
        Tests different designs.
        """
        site_preferences.bookings_per_room_in_study_room_booking_display_export = 1
        token = self.superuser_token

        self.create_study_room(
            token, name='First Room', room_id=101, display_design=self.get_display_design('DESIGN_001')
        )
        self.create_study_room(
            token, name='Second Room', room_id=202, display_design=self.get_display_design('999_TEST_999')
        )

        response = self.rest_get_study_room_display_export()
        self.assert_response_status(response, status.HTTP_200_OK)
        rows = self.get_csv_without_first_row(response)
        self.assertEquals(
            '101;First Room;;;;;;;02.12.2020;DESIGN_001' + LINE_BREAK +
            '202;Second Room;;;;;;;02.12.2020;999_TEST_999',
            rows
        )

    def test_that_the_current_date_is_put_in_every_row(self):
        """ Tests that the current date will be present in every room-row """
        site_preferences.bookings_per_room_in_study_room_booking_display_export = 1
        token = self.superuser_token

        self.create_study_room(token, name='First Room', room_id=101, display_design=self.default_design)
        self.create_study_room(token, name='Second Room', room_id=202, display_design=self.default_design)

        with time_machine.travel('2333-09-12 18:00'):
            response = self.rest_get_study_room_display_export()
            self.assert_response_status(response, status.HTTP_200_OK)
            rows = self.get_csv_without_first_row(response)
            self.assertEquals(
                '101;First Room;;;;;;;12.09.2333;Default' + LINE_BREAK +
                '202;Second Room;;;;;;;12.09.2333;Default',
                rows
            )

        cache.clear()
        with time_machine.travel('2020-12-02 13:00'):
            response = self.rest_get_study_room_display_export()
            self.assert_response_status(response, status.HTTP_200_OK)
            rows = self.get_csv_without_first_row(response)
            self.assertEquals(
                '101;First Room;;;;;;;02.12.2020;Default' + LINE_BREAK +
                '202;Second Room;;;;;;;02.12.2020;Default',
                rows
            )

    @time_machine.travel('2020-12-03 16:00')
    def test_that_the_export_only_contains_upcoming_bookings_of_today(self):
        site_preferences.bookings_per_room_in_study_room_booking_display_export = 1
        token = self.superuser_token

        room = self.create_study_room(token, name='My Study Room', room_id=12345, display_design=self.default_design)

        # create bookings for the past (earlier today)
        now = timezone.now()
        start_today = now.replace(hour=0, minute=0, second=0, microsecond=0)
        just_before_now = now - timedelta(seconds=1)
        self.create_booking(token, room, start=start_today, end=just_before_now)

        # create bookings for the future (after today)
        start_of_tomorrow = start_today + timedelta(days=1)
        day_after_tomorrow = start_of_tomorrow + timedelta(days=1)
        self.create_booking(token, room, start=start_of_tomorrow, end=day_after_tomorrow)

        response = self.rest_get_study_room_display_export()
        self.assert_response_status(response, status.HTTP_200_OK)
        rows = self.get_csv_without_first_row(response)
        self.assertEquals(
            '12345;My Study Room;;;;;;;03.12.2020;Default',
            rows
        )

    @time_machine.travel('2020-12-03 10:00', tz_offset=timedelta(hours=1))
    def test_exported_data_for_bookings_from_today(self):
        """
        Tests a successful export.
        Tests that bookings are limited to the the configured maximum per room.
        Tests that ongoing bookings are marked as ongoing (column "Laufend").
        """

        site_preferences.bookings_per_room_in_study_room_booking_display_export = 2
        token = self.superuser_token

        room1 = self.create_study_room(token, name='Room Uno', room_id=10001, display_design=self.default_design)
        room2 = self.create_study_room(token, name='Room Dos', room_id=10002, display_design=self.default_design)

        now = timezone.now()

        # create an ongoing booking for the first room
        self.create_booking(token, room1, start=now, end=now + timedelta(hours=1), title='Ongoing Meeting')

        # create multiple upcoming bookings (more than the configuration allows) for the second room
        self.create_booking(token, room2, start=now + timedelta(hours=1), end=now + timedelta(hours=2), title='A')
        self.create_booking(token, room2, start=now + timedelta(hours=2), end=now + timedelta(hours=3), title='B')
        self.create_booking(token, room2, start=now + timedelta(hours=3), end=now + timedelta(hours=4), title='C')
        self.create_booking(token, room2, start=now + timedelta(hours=4), end=now + timedelta(hours=5), title='D')

        response = self.rest_get_study_room_display_export()
        self.assert_response_status(response, status.HTTP_200_OK)

        print('<output>')
        print(response.content.decode())
        print('</output>')

        rows = self.get_csv_without_first_row(response)
        self.assertEquals(
            '10001;Room Uno;' +
            '11:00;12:00;True;Ongoing Meeting;Superuser;03.12.2020;' +
            ';;;;;;' +
            '03.12.2020;Default' +
            LINE_BREAK +
            '10002;Room Dos;' +
            '12:00;13:00;False;A;Superuser;03.12.2020;' +
            '13:00;14:00;False;B;Superuser;03.12.2020;' +
            '03.12.2020;Default',
            rows
        )

    @time_machine.travel('2020-12-14 12:00', tz_offset=timedelta(hours=1))
    def test_organiser_name(self):
        """ Tests the salutation and name of booking organisers. """

        site_preferences.bookings_per_room_in_study_room_booking_display_export = 5

        # create some users
        user1, token1 = self.create_user_and_log_in(username='user1', is_superuser=True)
        user1.userprofile.first_name = 'Heinrich'
        user1.userprofile.last_name = 'Müller'
        user1.userprofile.save()

        user2, token2 = self.create_user_and_log_in(username='user2', is_superuser=True)
        user2.userprofile.first_name = 'Peter'
        user2.userprofile.last_name = 'Schmidt'
        user2.userprofile.save()

        user3, token3 = self.create_user_and_log_in(username='user3', is_superuser=True)
        user3.userprofile.first_name = 'Barbara'
        user3.userprofile.save()

        user4, token4 = self.create_user_and_log_in(username='user4', is_superuser=True)
        user4.userprofile.last_name = 'Fischer'
        user4.userprofile.save()

        user5, token5 = self.create_user_and_log_in(username='user5', is_superuser=True)

        # create bookings for all users
        now = timezone.now()
        room1 = self.create_study_room(
            self.superuser_token, name='Room', room_id=101, display_design=self.default_design
        )
        self.create_booking(token1, room1, start=now + timedelta(hours=1), end=now + timedelta(hours=2), title='A')
        self.create_booking(token2, room1, start=now + timedelta(hours=2), end=now + timedelta(hours=3), title='B')
        self.create_booking(token3, room1, start=now + timedelta(hours=3), end=now + timedelta(hours=4), title='C')
        self.create_booking(token4, room1, start=now + timedelta(hours=4), end=now + timedelta(hours=5), title='D')
        self.create_booking(token5, room1, start=now + timedelta(hours=5), end=now + timedelta(hours=6), title='E')

        response = self.rest_get_study_room_display_export()
        self.assert_response_status(response, status.HTTP_200_OK)

        print('<output>')
        print(response.content.decode())
        print('</output>')

        rows = self.get_csv_without_first_row(response)
        self.assertEquals(
            '101;Room;' +
            '14:00;15:00;False;A;Heinrich Müller;14.12.2020;' +
            '15:00;16:00;False;B;Peter Schmidt;14.12.2020;' +
            '16:00;17:00;False;C;Barbara;14.12.2020;' +
            '17:00;18:00;False;D;Fischer;14.12.2020;' +
            '18:00;19:00;False;E;-;14.12.2020;' +
            '14.12.2020;Default',
            rows
        )

    @staticmethod
    def get_csv_without_first_row(response):
        full = response.content.decode().strip()
        assert LINE_BREAK in full, 'There are no rows to split'
        data_rows = full.split(LINE_BREAK)[1:]
        return LINE_BREAK.join(data_rows)
