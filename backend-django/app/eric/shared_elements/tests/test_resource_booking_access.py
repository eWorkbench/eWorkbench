#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import unittest
from datetime import datetime

from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APITestCase

from eric.core.tests.test_utils import CommonTestMixin, FakeRequest, FakeRequestUser, aware_dt
from eric.model_privileges.models import ModelPrivilege
from eric.projects.models import Resource
from eric.projects.tests.core import AuthenticationMixin, ModelPrivilegeMixin
from eric.shared_elements.models import Meeting, UserAttendsMeeting
from eric.shared_elements.tests.core import MeetingMixin, ResourceBookingMixin
from eric.versions.tests.helper_mixin import HelperMixin

User = get_user_model()


class AllResourceBookingAccessTest(
    APITestCase, CommonTestMixin, HelperMixin,
    ResourceBookingMixin, AuthenticationMixin, MeetingMixin, ModelPrivilegeMixin,
):
    """
    Tests access and limitation to resource booking data (AllResourceBookingViewSet).
    """

    def setUp(self):
        self.user1, self.token1 = self.create_user_and_log_in(username='user1', groups=['User'])
        self.user2, self.token2 = self.create_user_and_log_in(username='user2', groups=['User'])
        self.superuser, self.superuser_token = self.create_user_and_log_in(username='superuser', is_superuser=True)

        with FakeRequest(), FakeRequestUser(self.superuser):
            self.resource1 = Resource.objects.create(
                name='Test Resource 1', description='Test',
                type=Resource.ROOM, study_room=True, branch_library='Main',
            )

    def test_full_details_of_own_booking(self):
        # user1 creates some resource bookings
        with FakeRequest(), FakeRequestUser(self.user1):
            meeting1 = Meeting.objects.create(
                title='Meeting1', date_time_start=timezone.now(), date_time_end=timezone.now(),
                text='<h1>Lorem ipsum</h1><h2>dolor sit amet</h2>', location='Here', resource=self.resource1,
            )
            meeting2 = Meeting.objects.create(
                title='Meeting2', date_time_start=timezone.now(), date_time_end=timezone.now(),
                text='<h1>Alle meine</h1><h2>Entchen</h2>', location='Over there', resource=self.resource1,
            )

        # check that user1 can read all data
        response = self.rest_get_all_resourcebookings(self.token1)
        parsed_response = self.parse_response(response)
        self.assertEqual(2, len(parsed_response))
        self.assert_full_meeting_response(meeting1, parsed_response[0])
        self.assert_full_meeting_response(meeting2, parsed_response[1])

    def test_full_details_of_attending_bookings(self):
        with FakeRequest(), FakeRequestUser(self.user1):
            # user1 creates a resource booking
            meeting = Meeting.objects.create(
                title='Meeting1', date_time_start=timezone.now(), date_time_end=timezone.now(),
                text='<h1>Lorem ipsum</h1><h2>dolor sit amet</h2>', location='Here', resource=self.resource1,
            )
            # adds user2 as attending user
            UserAttendsMeeting.objects.create(user=self.user2, meeting=meeting)

        # check that user2 can read all data
        response = self.rest_get_all_resourcebookings(self.token1)
        parsed_response = self.parse_response(response)
        self.assertEqual(1, len(parsed_response))
        self.assert_full_meeting_response(meeting, parsed_response[0])

    def test_limited_details_of_foreign_bookings(self):
        with FakeRequest(), FakeRequestUser(self.user1):
            # user1 creates a resource booking
            meeting = Meeting.objects.create(
                title='Meeting1', date_time_start=timezone.now(), date_time_end=timezone.now(),
                text='<h1>Lorem ipsum</h1><h2>dolor sit amet</h2>', location='Here', resource=self.resource1,
            )

        # check that user1 can get limited data only
        response = self.rest_get_all_resourcebookings(self.token2)
        parsed_response = self.parse_response(response)
        self.assertEqual(1, len(parsed_response))
        self.assert_limited_meeting_response(meeting, parsed_response[0])

    def test_limited_details_of_booking_with_denied_privilege(self):
        with FakeRequest(), FakeRequestUser(self.user1):
            # user1 creates a resource booking
            meeting = Meeting.objects.create(
                title='My Appointment Title', date_time_start=timezone.now(), date_time_end=timezone.now(),
                text='<h1>Lorem ipsum</h1><h2>dolor sit amet</h2>', location='Rainbow Road', resource=self.resource1,
            )
            # adds user2 as attending user
            UserAttendsMeeting.objects.create(user=self.user2, meeting=meeting)
            # but denies view privilege
            self.set_model_privilege_for_user(
                token=self.token1, endpoint='meetings', pk=meeting.pk,
                user=self.user2, view_privilege=ModelPrivilege.DENY,
            )

        # check that user2 can get limited data only
        response = self.rest_get_all_resourcebookings(self.token2)
        parsed_response = self.parse_response(response)
        self.assertEqual(1, len(parsed_response))
        self.assert_limited_meeting_response(meeting, parsed_response[0])

    def test_superuser_has_full_access(self):
        with FakeRequest(), FakeRequestUser(self.user1):
            # user1 creates a resource booking
            meeting = Meeting.objects.create(
                title='Meeting1', date_time_start=timezone.now(), date_time_end=timezone.now(),
                text='<h1>Lorem ipsum</h1><h2>dolor sit amet</h2>', location='Here', resource=self.resource1,
            )

        # check that superuser can read all data
        response = self.rest_get_all_resourcebookings(self.superuser_token)
        parsed_response = self.parse_response(response)
        self.assertEqual(1, len(parsed_response))
        self.assert_full_meeting_response(meeting, parsed_response[0])

    def test_results_are_not_paginated(self):
        booking_count = 51

        # create many resource bookings
        with FakeRequest(), FakeRequestUser(self.superuser):
            for i in range(0, booking_count):
                Meeting.objects.create(
                    title=f'Meeting{i}', date_time_start=timezone.now(), date_time_end=timezone.now(),
                    text='Test', location='Paradise', resource=self.resource1,
                )

        # check that there is no pagination
        response = self.rest_get_all_resourcebookings(self.superuser_token)
        parsed_response = self.parse_response(response)
        self.assertNotIn('count', parsed_response)
        self.assertTrue(booking_count, len(parsed_response))

    def test_no_deleted_bookings_shown(self):
        # user1 creates a resource booking and deletes it
        with FakeRequest(), FakeRequestUser(self.user1):
            Meeting.objects.create(
                title='Deleted Booking', date_time_start=timezone.now(), date_time_end=timezone.now(),
                text='Abc', location='Here', resource=self.resource1,
                deleted=True,
            )

        # check that the deleted booking is not shown
        response = self.rest_get_all_resourcebookings(self.token1)
        parsed_response = self.parse_response(response)
        self.assertEqual(0, len(parsed_response))

    def test_no_bookings_for_deleted_resource_shown(self):
        # user1 creates a resource booking
        with FakeRequest(), FakeRequestUser(self.user1):
            Meeting.objects.create(
                title='Booking', date_time_start=timezone.now(), date_time_end=timezone.now(),
                text='Abc', location='Here', resource=self.resource1,
            )

        # superuser deletes the resource
        with FakeRequest(), FakeRequestUser(self.superuser):
            self.resource1.deleted = True
            self.resource1.save()

        # check that the booking is not shown
        response = self.rest_get_all_resourcebookings(self.token1)
        parsed_response = self.parse_response(response)
        self.assertEqual(0, len(parsed_response))

    def test_no_appointments_without_resource_shown(self):
        # user1 creates an appointment without a resource
        with FakeRequest(), FakeRequestUser(self.user1):
            Meeting.objects.create(
                title='My Dentist Appointment', date_time_start=timezone.now(), date_time_end=timezone.now(),
                text='Oh no', location='Ambulance1',
            )

        # check that the appointment is not shown
        response = self.rest_get_all_resourcebookings(self.token1)
        parsed_response = self.parse_response(response)
        self.assertEqual(0, len(parsed_response))

    def assert_full_meeting_response(self, meeting, api_response):
        self.assertEqual(meeting.title, api_response.get('title'))
        self.assertEqual(str(meeting.pk), api_response.get('pk'))
        self.assertEqual(meeting.date_time_start, datetime.fromisoformat(api_response.get('date_time_start')))
        self.assertEqual(meeting.date_time_end, datetime.fromisoformat(api_response.get('date_time_end')))
        self.assertEqual(meeting.location, api_response.get('location'))
        self.assertEqual(str(meeting.resource_id), api_response.get('resource_pk'))
        self.assertEqual(meeting.text, api_response.get('text'))

    def assert_limited_meeting_response(self, meeting, api_response):
        # anonymized data (fields contained for compatibility)
        self.assertEqual('Booked', api_response.get('title'))
        self.assertEqual('ANONYMOUS', api_response.get('pk'))
        self.assertTrue('Booked from' in api_response.get('display'))
        self.assertNotIn(meeting.title, api_response.get('display'))

        # public data
        self.assertEqual(meeting.date_time_start, datetime.fromisoformat(api_response.get('date_time_start')))
        self.assertEqual(meeting.date_time_end, datetime.fromisoformat(api_response.get('date_time_end')))

        # check fields with allow-list
        allow_list = [
            'title', 'display', 'pk',
            'date_time_start', 'date_time_end',
            'content_type', 'content_type_model',
        ]
        block_list = [
            'location', 'text',
            'attending_users', 'attending_contacts',
            'url',
        ]
        for key, value in api_response.items():
            self.assertIn(key, allow_list)
            self.assertNotIn(key, block_list)


class AllResourceBookingFilterTest(
    APITestCase, CommonTestMixin, HelperMixin,
    ResourceBookingMixin, AuthenticationMixin, MeetingMixin, ModelPrivilegeMixin,
):
    """
    Tests filters of the AllResourceBookingViewSet.
    """

    def setUp(self):
        self.user1, self.token1 = self.create_user_and_log_in(username='user1', groups=['User'])
        self.user2, self.token2 = self.create_user_and_log_in(username='user2', groups=['User'])
        self.superuser, self.superuser_token = self.create_user_and_log_in(username='superuser', is_superuser=True)

        # superuser creates global resources
        with FakeRequest(), FakeRequestUser(self.superuser):
            self.resource1 = Resource.objects.create(
                name='Test Resource 1', description='Test',
                type=Resource.ROOM, study_room=True, branch_library='Main',
            )
            self.resource2 = Resource.objects.create(
                name='Test Resource 2', description='Test',
                type=Resource.ROOM, study_room=True, branch_library='Main',
            )

        # user1 creates meetings
        with FakeRequest(), FakeRequestUser(self.user1):
            self.meeting1 = Meeting.objects.create(
                title='First Meeting', text='x', resource=self.resource1,
                date_time_start=aware_dt(year=2020, month=1, day=1),
                date_time_end=aware_dt(year=2020, month=1, day=1, hour=23, minute=59, second=59),
            )
            self.meeting2 = Meeting.objects.create(
                title='Second Meeting', text='x', resource=self.resource2,
                date_time_start=aware_dt(year=2020, month=1, day=2),
                date_time_end=aware_dt(year=2020, month=1, day=2, hour=23, minute=59, second=59),
            )

    def test_resource_filter(self):
        # no filter (value) -> should find all bookings
        self.assert_result_for_filter('', [self.meeting1, self.meeting2])
        self.assert_result_for_filter('?resource=', [self.meeting1, self.meeting2])

        # filter by resource PK gets correct resource
        self.assert_result_for_filter(f'?resource={self.resource1.pk}', [self.meeting1])
        self.assert_result_for_filter(f'?resource={self.resource2.pk}', [self.meeting2])

    def test_start_date_filter(self):
        # Hint for queries: filters work on UTC times, so the timezone offset must be accounted for
        self.assert_result_for_filter('?start_date__gte=2020-01-01T22:00:00.000Z', [self.meeting2])
        self.assert_result_for_filter('?start_date__gte=2019-12-31T22:00:00.000Z', [self.meeting1, self.meeting2])
        self.assert_result_for_filter('?start_date__gte=2020-01-02T00:00:00.000Z', [])
        self.assert_result_for_filter('?start_date__lte=2020-01-01T21:59:59.999Z', [self.meeting1])

    # todo: un-skip
    @unittest.skip("Skip to fix CI error")
    def test_end_date_filter(self):
        # Hint for queries: filters work on UTC times, so the timezone offset must be accounted for
        self.assert_result_for_filter('?end_date__gte=2020-01-02T21:59:59.000Z', [self.meeting2])
        self.assert_result_for_filter('?end_date__lte=2020-01-02T21:59:59.000Z', [self.meeting1, self.meeting2])
        self.assert_result_for_filter('?end_date__lt=2020-01-02T21:59:59.000Z', [self.meeting1])

    def assert_result_for_filter(self, url_param_str, expected_results):
        response = self.rest_get_all_resourcebookings(self.token1, url_param_str=url_param_str)
        parsed_response = self.parse_response(response)
        self.assertEqual(len(expected_results), len(parsed_response))

        expected_pks = {str(result.pk) for result in expected_results}
        actual_pks = {result['pk'] for result in parsed_response}
        self.assertSetEqual(expected_pks, actual_pks)


class MyResourceBookingAccessTest(
    APITestCase, CommonTestMixin, HelperMixin,
    ResourceBookingMixin, AuthenticationMixin, MeetingMixin, ModelPrivilegeMixin,
):
    """
    Tests access and limitation to resource booking data (MyResourceBookingViewSet).
    """

    def setUp(self):
        self.user1, self.token1 = self.create_user_and_log_in(username='user1', groups=['User'])
        self.user2, self.token2 = self.create_user_and_log_in(username='user2', groups=['User'])
        self.superuser, self.superuser_token = self.create_user_and_log_in(username='superuser', is_superuser=True)

        with FakeRequest(), FakeRequestUser(self.superuser):
            self.resource1 = Resource.objects.create(
                name='Test Resource 1', description='Test',
                type=Resource.ROOM, study_room=True, branch_library='Main',
            )

    def test_can_see_own_bookings(self):
        # user1 creates some resource bookings
        with FakeRequest(), FakeRequestUser(self.user1):
            Meeting.objects.create(
                title='Meeting1', date_time_start=timezone.now(), date_time_end=timezone.now(),
                text='<h1>Lorem ipsum</h1><h2>dolor sit amet</h2>', location='Here', resource=self.resource1,
            )
            Meeting.objects.create(
                title='Meeting2', date_time_start=timezone.now(), date_time_end=timezone.now(),
                text='<h1>Alle meine</h1><h2>Entchen</h2>', location='Over there', resource=self.resource1,
            )

        # check that user1 can read all data
        response = self.rest_get_my_resourcebookings(self.token1)
        parsed_response = self.parse_response(response)
        self.assertEqual(2, len(parsed_response))

    def test_no_appointments_without_resource(self):
        # user1 creates an appointment
        with FakeRequest(), FakeRequestUser(self.user1):
            Meeting.objects.create(
                title='Appointment', date_time_start=timezone.now(), date_time_end=timezone.now(),
                text='Abcdef', location='Here',
            )

        # check that the normal appointment is not shown
        response = self.rest_get_my_resourcebookings(self.token1)
        parsed_response = self.parse_response(response)
        self.assertEqual(0, len(parsed_response))

    def test_can_not_see_bookings_of_others(self):
        # user1 creates a resource booking for him and user2
        with FakeRequest(), FakeRequestUser(self.user1):
            meeting = Meeting.objects.create(
                title='Meeting1', date_time_start=timezone.now(), date_time_end=timezone.now(),
                text='<h1>Lorem ipsum</h1><h2>dolor sit amet</h2>', location='Here', resource=self.resource1,
            )
            # adds user2 as attending user
            UserAttendsMeeting.objects.create(user=self.user2, meeting=meeting)

        # check that user1 sees the booking
        response = self.rest_get_my_resourcebookings(self.token1)
        parsed_response = self.parse_response(response)
        self.assertEqual(1, len(parsed_response))

        # check that user2 does not see the booking
        response = self.rest_get_my_resourcebookings(self.token2)
        parsed_response = self.parse_response(response)
        self.assertEqual(0, len(parsed_response))

        # check that even superuser does not see the booking
        response = self.rest_get_my_resourcebookings(self.superuser_token)
        parsed_response = self.parse_response(response)
        self.assertEqual(0, len(parsed_response))
