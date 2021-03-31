#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from random import randint

from rest_framework.status import HTTP_201_CREATED, HTTP_400_BAD_REQUEST
from rest_framework.test import APITestCase

from eric.core.tests.test_utils import CommonTestMixin
from eric.projects.models import Resource
from eric.projects.tests.core import ResourceMixin
from eric.resources.models import StudyRoom, DisplayDesign


class ResourceFiltersTest(APITestCase, CommonTestMixin, ResourceMixin):
    """ Tests the API filters """

    def setUp(self):
        self.user, self.token = self.create_user_and_log_in(username='superuser', is_superuser=True)

        self.resource1 = self.create_resource('Resource One')
        self.resource2 = self.create_resource('Resource Two')
        self.resource3 = self.create_resource('Resource Three')

    def create_resource(self, name):
        resource, response = self.create_resource_orm(
            auth_token=self.token,
            project_pks=None,
            name=name,
            description='My Test Resource',
            resource_type=Resource.ROOM,
            user_availability=Resource.GLOBAL,
        )
        self.assert_response_status(response, expected_status_code=HTTP_201_CREATED)
        return resource

    @staticmethod
    def create_study_room_for_resource(resource, **kwargs):
        data = {
            'resource': resource,
            'branch_library': StudyRoom.MAIN_CAMPUS,
            'room_id': randint(100, 10_000),
            'display_design': DisplayDesign.objects.all().first(),
            'is_bookable_by_students': True,
        }
        data.update(kwargs)
        StudyRoom.objects.create(**data)

        return resource

    def test_query_without_filters(self):
        # create various study rooms
        self.create_study_room_for_resource(
            self.resource1, branch_library=StudyRoom.MAIN_CAMPUS
        )
        self.create_study_room_for_resource(
            self.resource2, branch_library=StudyRoom.MATH_IT, is_bookable_by_students=False
        )

        # query without any filters => should return all resources
        response = self.rest_query_resources(self.token)
        self.assert_resulting_resources(response, {self.resource1, self.resource2, self.resource3})

    def test_study_room_filter(self):
        # create study rooms for some resources
        room1 = self.create_study_room_for_resource(self.resource1, branch_library=StudyRoom.MAIN_CAMPUS)
        room2 = self.create_study_room_for_resource(self.resource2, branch_library=StudyRoom.MATH_IT)

        # query with study_room = False
        response = self.rest_query_resources(self.token, study_room='false')
        self.assert_resulting_resources(response, {self.resource3})

        # query with study_room = True
        response = self.rest_query_resources(self.token, study_room='true')
        self.assert_resulting_resources(response, {room1, room2})

    def test_branch_library_filter(self):
        # create study rooms for some resources
        room1 = self.create_study_room_for_resource(self.resource1, branch_library=StudyRoom.MAIN_CAMPUS)
        room2 = self.create_study_room_for_resource(self.resource2, branch_library=StudyRoom.MATH_IT)

        # query with branch_library filter
        response = self.rest_query_resources(self.token, branch_library=StudyRoom.MATH_IT)
        self.assert_resulting_resources(response, {room2})

        # query with invalid branch_library filter
        response = self.rest_query_resources(self.token, branch_library='TEST-I-DO-NOT-EXIST-TEST')
        self.assert_response_status(response, HTTP_400_BAD_REQUEST)

    def test_bookable_by_students_filter(self):
        # create study rooms for some resources
        room1 = self.create_study_room_for_resource(self.resource1)
        room2 = self.create_study_room_for_resource(self.resource2, is_bookable_by_students=True)
        room3 = self.create_study_room_for_resource(self.resource3, is_bookable_by_students=False)

        # query without filter -> should return all resources
        response = self.rest_query_resources(self.token)
        self.assert_resulting_resources(response, {room1, room2, room3})

        # query with bookable_by_students = False
        response = self.rest_query_resources(self.token, bookable_by_students='false')
        self.assert_resulting_resources(response, {room3})

        # query with bookable_by_students = True
        # WARNING: The behaviour here is not the way you might expect.
        #          bookable_by_students=True will return resources which are not study rooms (have no study_room_info)!
        #          This might depend on the default value for the is_bookable_by_students field.
        #          You can combine this filter with the study_room filter to get different results.
        # TODO: Find better solution for this filter, so it can be used more intuitively.
        response = self.rest_query_resources(self.token, bookable_by_students='true')
        self.assert_resulting_resources(response, {room1, room2})

    def test_filter_combination(self):
        """ Tests the correct results for a combination of all filters, as used in the study-room mode. """

        # add a non-study-room
        self.create_resource('Non Study Room Resource')
        resource5 = self.create_resource('Resource Five')

        # create study rooms
        room1 = self.create_study_room_for_resource(
            self.resource1, branch_library=StudyRoom.MAIN_CAMPUS, is_bookable_by_students=False,
        )
        room2 = self.create_study_room_for_resource(
            self.resource2, branch_library=StudyRoom.MAIN_CAMPUS, is_bookable_by_students=True,
        )
        room3 = self.create_study_room_for_resource(
            self.resource3, branch_library=StudyRoom.CHEMISTRY, is_bookable_by_students=False,
        )
        room4 = self.create_study_room_for_resource(
            resource5, branch_library=StudyRoom.CHEMISTRY, is_bookable_by_students=True,
        )

        # query all study rooms that are bookable by students
        response = self.rest_query_resources(self.token, study_room=True, bookable_by_students=True)
        self.assert_resulting_resources(response, {room2, room4})

        # query study rooms of the chemistry branch that are bookable by students
        response = self.rest_query_resources(
            self.token, study_room=True, bookable_by_students=True, branch_library=StudyRoom.CHEMISTRY
        )
        self.assert_resulting_resources(response, {room4})

    def assert_resulting_resources(self, response, expected_resources):
        json_response = self.parse_response(response)
        expected_names = set(resource.name for resource in expected_resources)
        actual_names = set(resource['name'] for resource in json_response['results'])
        print(f"Expected: {expected_names}")
        print(f"Actual: {actual_names}")
        self.assertSetEqual(expected_names, actual_names)
