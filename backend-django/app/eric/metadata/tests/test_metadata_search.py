#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import json
from datetime import datetime

from django.utils.dateparse import parse_datetime, parse_date
from rest_framework.status import HTTP_200_OK, HTTP_400_BAD_REQUEST, HTTP_201_CREATED
from rest_framework.test import APITestCase

from eric.core.tests import custom_json_handler
from eric.dmp.models import Dmp, DmpForm, DmpFormField
from eric.dmp.tests.core import DmpsMixin
from eric.labbooks.tests.core import LabBookMixin
from eric.metadata.models.models import MetadataField
from eric.metadata.tests import http_info
from eric.pictures.tests.core import PictureMixin
from eric.projects.models import Project
from eric.projects.tests.core import AuthenticationMixin, ProjectsMixin, ModelPrivilegeMixin
from eric.shared_elements.models import Task
from eric.shared_elements.tests.core import NoteMixin, TaskMixin, ContactMixin, MeetingMixin, FileMixin
from eric.versions.tests.helper_mixin import HelperMixin


class SearchTestMixin(AuthenticationMixin, ModelPrivilegeMixin, HelperMixin, ProjectsMixin, NoteMixin):
    def setUp(self):
        superuser, self.token = self.create_user_and_login("superuser", is_superuser=True)
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + self.token)

        # set up some base types
        self.whole_number_field = self.create_field("MyWholeNumber", MetadataField.BASE_TYPE_WHOLE_NUMBER)
        self.decimal_number_field = self.create_field("MyDecimalNumber", MetadataField.BASE_TYPE_DECIMAL_NUMBER)
        self.gps_field = self.create_field("MyGPS", MetadataField.BASE_TYPE_GPS)
        self.text_field = self.create_field("MyText", MetadataField.BASE_TYPE_TEXT)
        self.time_field = self.create_field("MyTime", MetadataField.BASE_TYPE_TIME)
        self.date_field = self.create_field("MyDate", MetadataField.BASE_TYPE_DATE)
        self.real_date_field = self.create_field("MyRealDate", MetadataField.BASE_TYPE_REAL_DATE)
        self.fraction_field = self.create_field("MyFraction", MetadataField.BASE_TYPE_FRACTION)
        self.checkbox_field = self.create_field("MyCheckbox", MetadataField.BASE_TYPE_CHECKBOX)
        self.selection_field = self.create_field("MySelection", MetadataField.BASE_TYPE_SELECTION)

        # create some workbench entities
        self.project = self.create_project(self.token, "MyProject", "My test project",
                                           Project.INITIALIZED, **http_info)
        self.note1 = self.create_note("Note1")
        self.note2 = self.create_note("Note2")
        self.note3 = self.create_note("Note3")
        self.note_without_metadata = self.create_note("NoteWithoutMetadata")

    def create_field(self, name, base_type):
        return MetadataField.objects.create(
            name=name, description="MyFieldDescription", base_type=base_type, type_settings={}
        )

    def create_note(self, title):
        note, response = self.create_note_orm(self.token, self.project.pk, title, "MyDescription", **http_info)
        return note

    def patch_metadata(self, entity, metadata, endpoint='notes'):
        response = self.client.patch(
            path='/api/{endpoint}/{pk}/'.format(endpoint=endpoint, pk=entity.pk),
            data=json.dumps(
                {
                    'metadata': metadata
                },
                default=custom_json_handler
            ),
            content_type='application/json',
            **http_info
        )
        self.assertEqual(response.status_code, HTTP_200_OK, response.content.decode())

    def send_search_request(self, data, content_type=None, expected_status_code=HTTP_200_OK):
        full_data = {
            'content_type': content_type,
            'parameters': data,
        }

        response = self.client.post(
            path='/api/metadata-search/',
            data=json.dumps(full_data, default=custom_json_handler),
            content_type='application/json',
            **http_info
        )
        self.assertEqual(response.status_code, expected_status_code, response.content.decode())

        if expected_status_code == HTTP_200_OK:
            return json.loads(response.content.decode())
        else:
            return response.content.decode()

    def get_result_pk_set(self, json_response):
        return {metadata['pk'] for metadata in json_response}

    def assert_result_list(self, json_response, expected_result_list):
        result_pks = self.get_result_pk_set(json_response)
        for entity in expected_result_list:
            self.assertTrue(str(entity.pk) in result_pks, '{} missing'.format(str(entity)))

        self.assertEqual(len(json_response), len(expected_result_list))


class TextSearchTest(SearchTestMixin, APITestCase):
    def test_simple_text_search(self):
        # contains search value
        self.patch_metadata(self.note1, [
            {'field': self.text_field.pk, 'values': {'value': 'abc'}, 'parameter_index': "0"},
            {'field': self.text_field.pk, 'values': {'value': 'HOLA! SOY YO!'}, 'parameter_index': "1"},
            {'field': self.text_field.pk, 'values': {'value': 'defghijklmnopqrstuvwxyz'}, 'parameter_index': "2"},
        ])
        # missing some part of the search value
        self.patch_metadata(self.note2, [
            {'field': self.text_field.pk, 'values': {'value': 'soy yo'}, 'parameter_index': "0"},
        ])
        # exact search value
        self.patch_metadata(self.note3, [
            {'field': self.text_field.pk, 'values': {'value': 'soy yo!'}, 'parameter_index': "0"},
        ])
        # completely different value
        note4 = self.create_note('Note4')
        self.patch_metadata(note4, [
            {'field': self.text_field.pk, 'values': {'value': 'muchas gracias'}, 'parameter_index': "0"},
        ])

        json_response = self.send_search_request([[
            {'field': self.text_field.pk, 'operator': '=', 'values': {'value': 'soy yo!'}, 'parameter_index': "0"},
        ]])
        self.assert_result_list(json_response, [self.note1, self.note3])

    def test_invalid_text_operators(self):
        self.patch_metadata(self.note1, [
            {'field': self.text_field.pk, 'values': {'value': 'HOLA! SOY YO!'}, 'parameter_index': "0"},
        ])

        for operator in ['<', '<=', '>', '>=']:
            response = self.send_search_request([[
                {'field': self.text_field.pk, 'operator': operator, 'values': {'value': 'abc'}, 'parameter_index': "0"},
            ]], expected_status_code=HTTP_400_BAD_REQUEST)
            self.assertTrue('invalid operator' in response.lower())


class SelectionSearchTest(SearchTestMixin, APITestCase):
    def test_simple_search(self):
        self.patch_metadata(self.note1, [
            {'field': self.selection_field.pk, 'values':
                {'answers': [{'answer': 'Check Point 2', 'selected': True},
                             {'answer': 'Check Point 4'},
                             {'answer': 'Check Point 3', 'selected': True},
                             {'answer': 'Check Point 5'},
                             {'answer': 'Check Point 1', 'selected': True}]},
                 'parameter_index': '0'},
            {'field': self.selection_field.pk, 'values':
                {'single_selected': 'Check Point 1'},
                 'parameter_index': '0'},
            {'field': self.selection_field.pk, 'values':
                {'answers': [{'answer': 'Check Point 2', 'selected': True},
                             {'answer': 'Check Point 4'},
                             {'answer': 'Check Point 3'},
                             {'answer': 'Check Point 5'},
                             {'answer': 'Check Point 1'}],
                 'custom_input': 'test text'},
                 'parameter_index': '0'},
            {'field': self.selection_field.pk, 'values':
                {'single_selected': 'Check Point 4',
                 'custom_input': 'test text'},
                 'parameter_index': '0'},
        ])

        json_response = self.send_search_request([[
            {'field': self.selection_field.pk, 'operator': '=', 'values':
                {'answers': [{'answer': 'Check Point 2', 'selected': True},
                             {'answer': 'Check Point 4'},
                             {'answer': 'Check Point 3', 'selected': True},
                             {'answer': 'Check Point 5'},
                             {'answer': 'Check Point 1', 'selected': True}]},
                 'parameter_index': '0'},
        ]])
        self.assert_result_list(json_response, [self.note1])

        json_response = self.send_search_request([[
            {'field': self.selection_field.pk, 'operator': '=', 'values':
                {'answers': [{'answer': 'Check Point 2', 'selected': True},
                             {'answer': 'Check Point 4'},
                             {'answer': 'Check Point 3', 'selected': False},
                             {'answer': 'Check Point 5', 'selected': True},
                             {'answer': 'Check Point 1', 'selected': True}]},
                 'parameter_index': '0'},
        ]])
        self.assert_result_list(json_response, [])

        json_response = self.send_search_request([[
            {'field': self.selection_field.pk, 'operator': '=', 'values':
                {'single_selected': 'Check Point 1'},
                 'parameter_index': '0'},
        ]])
        self.assert_result_list(json_response, [self.note1])

        json_response = self.send_search_request([[
            {'field': self.selection_field.pk, 'operator': '=', 'values':
                {'single_selected': 'Check Point 2'},
                 'parameter_index': '0'},
        ]])
        self.assert_result_list(json_response, [])

        json_response = self.send_search_request([[
            {'field': self.selection_field.pk, 'operator': '=', 'values':
                {'answers': [{'answer': 'Check Point 2', 'selected': True},
                             {'answer': 'Check Point 4'},
                             {'answer': 'Check Point 3', 'selected': False},
                             {'answer': 'Check Point 5'},
                             {'answer': 'Check Point 1'}],
                 'custom_input': 'test text'},
                 'parameter_index': '0'},
        ]])
        self.assert_result_list(json_response, [self.note1])

        json_response = self.send_search_request([[
            {'field': self.selection_field.pk, 'operator': '=', 'values':
                {'answers': [{'answer': 'Check Point 2', 'selected': True},
                             {'answer': 'Check Point 4'},
                             {'answer': 'Check Point 3', 'selected': False},
                             {'answer': 'Check Point 5'},
                             {'answer': 'Check Point 1'}],
                 'custom_input': 'other test text'},
                 'parameter_index': '0'},
        ]])
        self.assert_result_list(json_response, [])

        json_response = self.send_search_request([[
            {'field': self.selection_field.pk, 'operator': '=', 'values':
                {'single_selected': 'Check Point 4',
                 'custom_input': 'test text'},
                 'parameter_index': '0'},
        ]])
        self.assert_result_list(json_response, [self.note1])

        json_response = self.send_search_request([[
            {'field': self.selection_field.pk, 'operator': '=', 'values':
                {'single_selected': 'Check Point 4',
                 'custom_input': 'other test text'},
                 'parameter_index': '0'},
        ]])
        self.assert_result_list(json_response, [])

    def test_invalid_operators(self):
        self.patch_metadata(self.note1, [
            {'field': self.selection_field.pk, 'values': {'single_selected': 'Check Point 1'},
                                                'parameter_index': '0'},
        ])

        for operator in ['<', '<=', '>', '>=']:
            response = self.send_search_request([[
                {'field': self.selection_field.pk, 'operator': operator,
                 'values': {'single_selected': 'Check Point 1'},
                                                'parameter_index': '0'},
            ]], expected_status_code=HTTP_400_BAD_REQUEST)
            self.assertTrue('invalid operator' in response.lower())


class GPSSearchTest(SearchTestMixin, APITestCase):
    def test_simple_search(self):
        self.patch_metadata(self.note1, [
            {'field': self.gps_field.pk, 'values': {'x': 'abc', 'y': 'def'}, 'parameter_index': "0"},
            {'field': self.gps_field.pk, 'values': {'x': 'MnO', 'y': 'pQrSt'}, 'parameter_index': "1"},
            {'field': self.gps_field.pk, 'values': {'x': 'UVW', 'y': 'XYZ'}, 'parameter_index': "2"},
        ])

        json_response = self.send_search_request([[
            {'field': self.gps_field.pk, 'operator': '=', 'values': {'x': 'mno', 'y': 'pqrst'}, 'parameter_index': "0"},
        ]])
        self.assert_result_list(json_response, [self.note1])

        json_response = self.send_search_request([[
            {'field': self.gps_field.pk, 'operator': '=', 'values': {'x': 'mno', 'y': 'abc'}, 'parameter_index': "0"},
        ]])
        self.assert_result_list(json_response, [])

    def test_invalid_operators(self):
        self.patch_metadata(self.note1, [
            {'field': self.gps_field.pk, 'values': {'x': 'abc', 'y': 'def'}, 'parameter_index': "0"},
        ])

        for operator in ['<', '<=', '>', '>=']:
            response = self.send_search_request([[
                {'field': self.gps_field.pk, 'operator': operator, 'values': {'x': 'abc', 'y': 'def'},
                 'parameter_index': "0"},
            ]], expected_status_code=HTTP_400_BAD_REQUEST)
            self.assertTrue('invalid operator' in response.lower())


class WholeNumberSearchTest(SearchTestMixin, APITestCase):
    def test_simple_search(self):
        self.patch_metadata(self.note1, [
            {'field': self.whole_number_field.pk, 'values': {'value': 321}, 'parameter_index': "0"},
        ])
        self.patch_metadata(self.note2, [
            {'field': self.whole_number_field.pk, 'values': {'value': 123}, 'parameter_index': "1"},
        ])
        self.patch_metadata(self.note3, [
            {'field': self.whole_number_field.pk, 'values': {'value': 987654321}, 'parameter_index': "2"},
        ])

        # operator =
        json_response = self.send_search_request([[
            {'field': self.whole_number_field.pk, 'operator': '=', 'values': {'value': 321}, 'parameter_index': "0"},
        ]])
        self.assert_result_list(json_response, [self.note1])

        # operator >
        json_response = self.send_search_request([[
            {'field': self.whole_number_field.pk, 'operator': '>', 'values': {'value': 123}, 'parameter_index': "0"},
        ]])
        self.assert_result_list(json_response, [self.note1, self.note3])

        # operator >=
        json_response = self.send_search_request([[
            {'field': self.whole_number_field.pk, 'operator': '>=', 'values': {'value': 123}, 'parameter_index': "0"},
        ]])
        self.assert_result_list(json_response, [self.note1, self.note2, self.note3])

        # operator <
        json_response = self.send_search_request([[
            {'field': self.whole_number_field.pk, 'operator': '<', 'values': {'value': 124}, 'parameter_index': "0"},
        ]])
        self.assert_result_list(json_response, [self.note2])

        # operator <=
        json_response = self.send_search_request([[
            {'field': self.whole_number_field.pk, 'operator': '<=', 'values': {'value': 321}, 'parameter_index': "0"},
        ]])
        self.assert_result_list(json_response, [self.note1, self.note2])


class CheckboxSearchTest(SearchTestMixin, APITestCase):
    def test_simple_search(self):
        self.patch_metadata(self.note1, [
            {'field': self.checkbox_field.pk, 'values': {'value': True}, 'parameter_index': "0"},
        ])
        self.patch_metadata(self.note2, [
            {'field': self.checkbox_field.pk, 'values': {'value': False}, 'parameter_index': "1"},
        ])

        # operator =
        json_response = self.send_search_request([[
            {'field': self.checkbox_field.pk, 'operator': '=', 'values': {'value': True}, 'parameter_index': "0"},
        ]])
        self.assert_result_list(json_response, [self.note1])

        json_response = self.send_search_request([[
            {'field': self.checkbox_field.pk, 'operator': '=', 'values': {'value': False}, 'parameter_index': "1"},
        ]])
        self.assert_result_list(json_response, [self.note2])

        # operator >
        self.send_search_request([[
            {'field': self.checkbox_field.pk, 'operator': '>', 'values': {'value': True}, 'parameter_index': "0"},
        ]], expected_status_code=HTTP_400_BAD_REQUEST)


class DecimalNumberSearchTest(SearchTestMixin, APITestCase):
    """
    Works the very same way for Currency and Percentage -> testing DecimalNumber should be enough.
    """

    def test_simple_search(self):
        self.patch_metadata(self.note1, [
            {'field': self.decimal_number_field.pk, 'values': {'value': 5.321}, 'parameter_index': "0"},
        ])
        self.patch_metadata(self.note2, [
            {'field': self.decimal_number_field.pk, 'values': {'value': 5.123}, 'parameter_index': "1"},
        ])
        self.patch_metadata(self.note3, [
            {'field': self.decimal_number_field.pk, 'values': {'value': 12345.9876}, 'parameter_index': "2"},
        ])

        # operator =
        json_response = self.send_search_request([[
            {'field': self.decimal_number_field.pk, 'operator': '=', 'values': {'value': 5.321},
             'parameter_index': "0"},
        ]])
        self.assert_result_list(json_response, [self.note1])

        # operator >
        json_response = self.send_search_request([[
            {'field': self.decimal_number_field.pk, 'operator': '>', 'values': {'value': 5.123},
             'parameter_index': "0"},
        ]])
        self.assert_result_list(json_response, [self.note1, self.note3])

        # operator >=
        json_response = self.send_search_request([[
            {'field': self.decimal_number_field.pk, 'operator': '>=', 'values': {'value': 5.123},
             'parameter_index': "0"},
        ]])
        self.assert_result_list(json_response, [self.note1, self.note2, self.note3])

        # operator <
        json_response = self.send_search_request([[
            {'field': self.decimal_number_field.pk, 'operator': '<', 'values': {'value': 5.124},
             'parameter_index': "0"},
        ]])
        self.assert_result_list(json_response, [self.note2])

        # operator <=
        json_response = self.send_search_request([[
            {'field': self.decimal_number_field.pk, 'operator': '<=', 'values': {'value': 5.321},
             'parameter_index': "0"},
        ]])
        self.assert_result_list(json_response, [self.note1, self.note2])


class TimeSearchTest(SearchTestMixin, APITestCase):
    """
    Tests searching for time metadata, which is stored as sum of minutes,
    so this is basically the same as WholeNumberSearchTest.
    """

    def test_simple_search(self):
        self.patch_metadata(self.note1, [
            {'field': self.time_field.pk, 'values': {'value': 10 * 60 + 35}, 'parameter_index': "0"},
        ])
        self.patch_metadata(self.note2, [
            {'field': self.time_field.pk, 'values': {'value': 10 * 60 + 10}, 'parameter_index': "1"},
        ])
        self.patch_metadata(self.note3, [
            {'field': self.time_field.pk, 'values': {'value': 23 * 60 + 59}, 'parameter_index': "2"},
        ])

        # operator =
        json_response = self.send_search_request([[
            {'field': self.time_field.pk, 'operator': '=', 'values': {'value': 10 * 60 + 35}, 'parameter_index': "0"},
        ]])
        self.assert_result_list(json_response, [self.note1])

        # operator >
        json_response = self.send_search_request([[
            {'field': self.time_field.pk, 'operator': '>', 'values': {'value': 10 * 60 + 10}, 'parameter_index': "0"},
        ]])
        self.assert_result_list(json_response, [self.note1, self.note3])

        # operator >=
        json_response = self.send_search_request([[
            {'field': self.time_field.pk, 'operator': '>=', 'values': {'value': 10 * 60 + 35}, 'parameter_index': "0"},
        ]])
        self.assert_result_list(json_response, [self.note1, self.note3])

        # operator <
        json_response = self.send_search_request([[
            {'field': self.time_field.pk, 'operator': '<', 'values': {'value': 10 * 60 + 35}, 'parameter_index': "0"},
        ]])
        self.assert_result_list(json_response, [self.note2])

        # operator <=
        json_response = self.send_search_request([[
            {'field': self.time_field.pk, 'operator': '<=', 'values': {'value': 10 * 60 + 35}, 'parameter_index': "0"},
        ]])
        self.assert_result_list(json_response, [self.note1, self.note2])


class DateSearchTest(SearchTestMixin, APITestCase):
    def test_simple_search(self):
        self.patch_metadata(self.note1, [
            {'field': self.date_field.pk, 'values': {'value': parse_datetime("2018-01-01 01:01").isoformat()},
             'parameter_index': "0"},
        ])
        self.patch_metadata(self.note2, [
            {'field': self.date_field.pk, 'values': {'value': parse_datetime("2018-01-01 01:00").isoformat()},
             'parameter_index': "1"},
        ])
        self.patch_metadata(self.note3, [
            {'field': self.date_field.pk, 'values': {'value': parse_datetime("2027-04-17 23:59").isoformat()},
             'parameter_index': "2"},
        ])

        # operator =
        json_response = self.send_search_request([[
            {'field': self.date_field.pk, 'operator': '=', 'values': {'value': parse_datetime("2018-01-01 01:01")},
             'parameter_index': "0"},
        ]])
        self.assert_result_list(json_response, [self.note1])

        # operator >
        json_response = self.send_search_request([[
            {'field': self.date_field.pk, 'operator': '>', 'values': {'value': parse_datetime("2018-01-01 01:00")},
             'parameter_index': "0"},
        ]])
        self.assert_result_list(json_response, [self.note1, self.note3])

        # operator >=
        json_response = self.send_search_request([[
            {'field': self.date_field.pk, 'operator': '>=', 'values': {'value': parse_datetime("2018-01-01 01:01")},
             'parameter_index': "0"},
        ]])
        self.assert_result_list(json_response, [self.note1, self.note3])

        # operator <
        json_response = self.send_search_request([[
            {'field': self.date_field.pk, 'operator': '<', 'values': {'value': parse_datetime("2027-04-17 23:59")},
             'parameter_index': "0"},
        ]])
        self.assert_result_list(json_response, [self.note1, self.note2])

        # operator <=
        json_response = self.send_search_request([[
            {'field': self.date_field.pk, 'operator': '<=', 'values': {'value': parse_datetime("2018-01-01 01:01")},
             'parameter_index': "0"},
        ]])
        self.assert_result_list(json_response, [self.note1, self.note2])


class RealDateSearchTest(SearchTestMixin, APITestCase):
    def test_simple_search(self):
        self.patch_metadata(self.note1, [
            {'field': self.real_date_field.pk, 'values': {'value': parse_date("2018-01-01")},
             'parameter_index': "0"},
        ])
        self.patch_metadata(self.note2, [
            {'field': self.real_date_field.pk, 'values': {'value': parse_date("2018-01-02")},
             'parameter_index': "1"},
        ])
        self.patch_metadata(self.note3, [
            {'field': self.real_date_field.pk, 'values': {'value': parse_date("2027-04-17")},
             'parameter_index': "2"},
        ])

        # operator =
        json_response = self.send_search_request([[
            {'field': self.real_date_field.pk, 'operator': '=', 'values': {'value': parse_date("2018-01-01")},
             'parameter_index': "0"},
        ]])
        self.assert_result_list(json_response, [self.note1])

        # operator >
        json_response = self.send_search_request([[
            {'field': self.real_date_field.pk, 'operator': '>', 'values': {'value': parse_date("2018-01-01")},
             'parameter_index': "0"},
        ]])
        self.assert_result_list(json_response, [self.note2, self.note3])

        # operator >
        json_response = self.send_search_request([[
            {'field': self.real_date_field.pk, 'operator': '>', 'values': {'value': parse_date("2018-01-02")},
             'parameter_index': "0"},
        ]])
        self.assert_result_list(json_response, [self.note3])

        # operator >=
        json_response = self.send_search_request([[
            {'field': self.real_date_field.pk, 'operator': '>=', 'values': {'value': parse_date("2018-01-02")},
             'parameter_index': "0"},
        ]])
        self.assert_result_list(json_response, [self.note2, self.note3])

        # operator >=
        json_response = self.send_search_request([[
            {'field': self.real_date_field.pk, 'operator': '>=', 'values': {'value': parse_date("2018-01-01")},
             'parameter_index': "0"},
        ]])
        self.assert_result_list(json_response, [self.note1, self.note2, self.note3])

        # operator <
        json_response = self.send_search_request([[
            {'field': self.real_date_field.pk, 'operator': '<', 'values': {'value': parse_date("2027-04-17")},
             'parameter_index': "0"},
        ]])
        self.assert_result_list(json_response, [self.note1, self.note2])

        # operator <
        json_response = self.send_search_request([[
            {'field': self.real_date_field.pk, 'operator': '<', 'values': {'value': parse_date("2018-01-02")},
             'parameter_index': "0"},
        ]])
        self.assert_result_list(json_response, [self.note1])

        # operator <=
        json_response = self.send_search_request([[
            {'field': self.real_date_field.pk, 'operator': '<=', 'values': {'value': parse_date("2018-01-02")},
             'parameter_index': "0"},
        ]])
        self.assert_result_list(json_response, [self.note1, self.note2])


class FractionSearchTest(SearchTestMixin, APITestCase):
    def test_simple_search(self):
        self.patch_metadata(self.note1, [
            {'field': self.fraction_field.pk, 'values': {'numerator': 4, 'denominator': 789}, 'parameter_index': "0"},
        ])
        self.patch_metadata(self.note2, [
            {'field': self.fraction_field.pk, 'values': {'numerator': 3, 'denominator': 789}, 'parameter_index': "1"},
        ])
        self.patch_metadata(self.note3, [
            {'field': self.fraction_field.pk, 'values': {'numerator': 321, 'denominator': 1}, 'parameter_index': "2"},
        ])

        # operator =
        json_response = self.send_search_request([[
            {'field': self.fraction_field.pk, 'operator': '=', 'values': {'numerator': 4, 'denominator': 789},
             'parameter_index': "0"},
        ]])
        self.assert_result_list(json_response, [self.note1])

        # operator >
        json_response = self.send_search_request([[
            {'field': self.fraction_field.pk, 'operator': '>', 'values': {'numerator': 4, 'denominator': 789},
             'parameter_index': "0"},
        ]])
        self.assert_result_list(json_response, [self.note3])

        # operator >=
        json_response = self.send_search_request([[
            {'field': self.fraction_field.pk, 'operator': '>=', 'values': {'numerator': 4, 'denominator': 789},
             'parameter_index': "0"},
        ]])
        self.assert_result_list(json_response, [self.note1, self.note3])

        # operator <
        json_response = self.send_search_request([[
            {'field': self.fraction_field.pk, 'operator': '<', 'values': {'numerator': 321, 'denominator': 1},
             'parameter_index': "0"},
        ]])
        self.assert_result_list(json_response, [self.note1, self.note2])

        # operator <=
        json_response = self.send_search_request([[
            {'field': self.fraction_field.pk, 'operator': '<=', 'values': {'numerator': 4, 'denominator': 789},
             'parameter_index': "0"},
        ]])
        self.assert_result_list(json_response, [self.note1, self.note2])

    def test_null_values(self):
        self.patch_metadata(self.note1, [
            # value: 0 -- should be found when searching for 0
            {'field': self.fraction_field.pk, 'values': {'numerator': 0, 'denominator': 1}, 'parameter_index': "0"},
            # value: undefined -- should never be found
            {'field': self.fraction_field.pk, 'values': {'numerator': 1, 'denominator': 0}, 'parameter_index': "1"},
            # value: undefined -- should never be found
            {'field': self.fraction_field.pk, 'values': {'numerator': 0, 'denominator': 0}, 'parameter_index': "2"},
        ])

        # request x/0 = undefined value -> HTTP 400
        response = self.send_search_request([[
            {'field': self.fraction_field.pk, 'operator': '=', 'values': {'numerator': 1, 'denominator': 0},
             'parameter_index': "0"},
        ]], expected_status_code=HTTP_400_BAD_REQUEST)

        # request 0/0 = undefined value -> HTTP 400
        response = self.send_search_request([[
            {'field': self.fraction_field.pk, 'operator': '>', 'values': {'numerator': 0, 'denominator': 0},
             'parameter_index': "0"},
        ]], expected_status_code=HTTP_400_BAD_REQUEST)

        # request 0/1 -> find fractions with value 0
        json_response = self.send_search_request([[
            {'field': self.fraction_field.pk, 'operator': '>=', 'values': {'numerator': 0, 'denominator': 1},
             'parameter_index': "0"},
        ]])
        self.assert_result_list(json_response, [self.note1])


class InvalidFieldSearchTest(SearchTestMixin, APITestCase):
    def test_search_with_invalid_field(self):
        self.send_search_request([[
            {'field': self.note1.pk, 'operator': '=', 'values': {'value': 123},
             'parameter_index': "0"},
        ]], expected_status_code=HTTP_400_BAD_REQUEST)


class EmptySearchTest(SearchTestMixin, APITestCase):
    def test_no_parameters_no_content_type(self):
        self.patch_metadata(self.note1, [
            {'field': self.whole_number_field.pk, 'values': {'value': 23}, 'parameter_index': "0"},
        ])
        self.send_search_request(
            data=[[]],
            content_type=None,
            expected_status_code=HTTP_400_BAD_REQUEST,
        )

    def test_no_parameters_but_content_type(self):
        self.patch_metadata(self.note1, [
            {'field': self.whole_number_field.pk, 'values': {'value': 23}, 'parameter_index': "0"},
        ])
        self.send_search_request(
            data=[[]],
            content_type='note',
            expected_status_code=HTTP_400_BAD_REQUEST,
        )


class MultiParameterSearchTest(SearchTestMixin, APITestCase):
    def test_multiple_and_parameters(self):
        self.patch_metadata(self.note1, [
            {'field': self.date_field.pk, 'values': {'value': parse_datetime('2018-01-01 01:01')},
             'parameter_index': "0"},
            {'field': self.text_field.pk, 'values': {'value': 'HOLA! SOY YO!'}, 'parameter_index': "0"},
            {'field': self.whole_number_field.pk, 'values': {'value': 23}, 'parameter_index': "0"},
        ])
        self.patch_metadata(self.note2, [
            {'field': self.date_field.pk, 'values': {'value': parse_datetime('2018-12-12 12:12')},
             'parameter_index': "0"},
            {'field': self.text_field.pk, 'values': {'value': 'HOLA! SOY YO!'}, 'parameter_index': "0"},
            {'field': self.whole_number_field.pk, 'values': {'value': 23}, 'parameter_index': "0"},
        ])
        self.patch_metadata(self.note3, [
            {'field': self.text_field.pk, 'values': {'value': 'HOLA! SOY YO!'}, 'parameter_index': "0"},
        ])

        json_response = self.send_search_request([[
            {'field': self.text_field.pk, 'operator': '=', 'values': {'value': 'soy yo!'}, 'parameter_index': "0"},
            {'field': self.date_field.pk, 'operator': '<', 'values': {'value': parse_datetime('2018-02-02 22:22')},
             'parameter_index': "0"},
            {'field': self.whole_number_field.pk, 'operator': '>=', 'values': {'value': 20}, 'parameter_index': "0"},
        ]])
        self.assert_result_list(json_response, [self.note1])

    def test_multiple_or_parameters(self):
        self.note4 = self.create_note("Note4")
        self.note5 = self.create_note("Note5")
        self.note6 = self.create_note("Note6")

        self.patch_metadata(self.note1, [
            {'field': self.text_field.pk, 'values': {'value': 'HOLA! SOY YO!'}, 'parameter_index': "0"},
            {'field': self.whole_number_field.pk, 'values': {'value': 23}, 'parameter_index': "0"},
        ])
        self.patch_metadata(self.note2, [
            {'field': self.whole_number_field.pk, 'values': {'value': 23}, 'parameter_index': "0"},
        ])
        self.patch_metadata(self.note3, [
            {'field': self.text_field.pk, 'values': {'value': 'Que pasa?'}, 'parameter_index': "0"},
            {'field': self.whole_number_field.pk, 'values': {'value': 77}, 'parameter_index': "0"},
        ])
        self.patch_metadata(self.note4, [
            {'field': self.text_field.pk, 'values': {'value': 'HOLA! SOY YO!'}, 'parameter_index': "0"},
        ])
        self.patch_metadata(self.note5, [
            {'field': self.text_field.pk, 'values': {'value': 'Hola! Que pasa amigo?'}, 'parameter_index': "0"},
        ])
        self.patch_metadata(self.note6, [
            {'field': self.whole_number_field.pk, 'values': {'value': 77}, 'parameter_index': "0"},
        ])

        json_response = self.send_search_request([
            [{'field': self.text_field.pk, 'operator': '=', 'values': {'value': 'que pasa'}, 'parameter_index': "0"}, ],
            [{'field': self.whole_number_field.pk, 'operator': '<=', 'values': {'value': 23},
              'parameter_index': "0"}, ],
        ])
        self.assert_result_list(json_response, [self.note1, self.note2, self.note3, self.note5])

    def test_multiple_matches_for_same_entity(self):
        self.patch_metadata(self.note1, [
            {'field': self.text_field.pk, 'values': {'value': 'hello'}, 'parameter_index': "0"},
            {'field': self.whole_number_field.pk, 'values': {'value': 111}, 'parameter_index': "0"},
            {'field': self.decimal_number_field.pk, 'values': {'value': 111.0}, 'parameter_index': "0"},
        ])

        json_response = self.send_search_request([
            [{'field': self.text_field.pk, 'operator': '=', 'values': {'value': 'hello'}, 'parameter_index': "0"}, ],
            [{'field': self.whole_number_field.pk, 'operator': '>=', 'values': {'value': 0}, 'parameter_index': "0"}, ],
            [{'field': self.decimal_number_field.pk, 'operator': '>=', 'values': {'value': 0},
              'parameter_index': "0"}, ],
        ])
        self.assertEqual(len(json_response), 1)
        self.assert_result_list(json_response, [self.note1])

    def test_multiple_or_and_parameters(self):
        self.note4 = self.create_note("Note4")
        self.note5 = self.create_note("Note5")
        self.note6 = self.create_note("Note6")

        self.patch_metadata(self.note1, [
            {'field': self.text_field.pk, 'values': {'value': 'mario'}, 'parameter_index': "0"},
            {'field': self.whole_number_field.pk, 'values': {'value': 2}, 'parameter_index': "0"},
            {'field': self.decimal_number_field.pk, 'values': {'value': 0.222}, 'parameter_index': "0"},
        ])
        self.patch_metadata(self.note2, [
            {'field': self.text_field.pk, 'values': {'value': 'mario'}, 'parameter_index': "0"},
            {'field': self.whole_number_field.pk, 'values': {'value': 2}, 'parameter_index': "0"},
            {'field': self.decimal_number_field.pk, 'values': {'value': 0.333}, 'parameter_index': "0"},
        ])
        self.patch_metadata(self.note3, [
            {'field': self.text_field.pk, 'values': {'value': 'mario'}, 'parameter_index': "0"},
            {'field': self.whole_number_field.pk, 'values': {'value': 8}, 'parameter_index': "0"},
            {'field': self.decimal_number_field.pk, 'values': {'value': 0.4}, 'parameter_index': "0"},
        ])
        self.patch_metadata(self.note4, [
            {'field': self.text_field.pk, 'values': {'value': 'yoshi'}, 'parameter_index': "0"},
            {'field': self.whole_number_field.pk, 'values': {'value': 3}, 'parameter_index': "0"},
            {'field': self.decimal_number_field.pk, 'values': {'value': 0.5}, 'parameter_index': "0"},
        ])
        self.patch_metadata(self.note5, [
            {'field': self.text_field.pk, 'values': {'value': 'yoshi'}, 'parameter_index': "0"},
            {'field': self.whole_number_field.pk, 'values': {'value': 5}, 'parameter_index': "0"},
            {'field': self.decimal_number_field.pk, 'values': {'value': 0.6}, 'parameter_index': "0"},
        ])
        self.patch_metadata(self.note6, [
            {'field': self.text_field.pk, 'values': {'value': 'yoshi'}, 'parameter_index': "0"},
            {'field': self.whole_number_field.pk, 'values': {'value': 7}, 'parameter_index': "0"},
            {'field': self.decimal_number_field.pk, 'values': {'value': 0.7}, 'parameter_index': "0"},
        ])

        json_response = self.send_search_request([
            [
                # note3, note5, note6
                {'field': self.whole_number_field.pk, 'operator': '>=', 'values': {'value': 5}, 'parameter_index': "0"},
            ],
            [
                # note5
                {'field': self.whole_number_field.pk, 'operator': '=', 'values': {'value': 5}, 'parameter_index': "0"},
                {'field': self.text_field.pk, 'operator': '=', 'values': {'value': 'yoshi'}, 'parameter_index': "0"},
            ],
            [
                # note2
                {'field': self.whole_number_field.pk, 'operator': '<=', 'values': {'value': 3}, 'parameter_index': "0"},
                {'field': self.text_field.pk, 'operator': '=', 'values': {'value': 'mario'}, 'parameter_index': "0"},
                {'field': self.decimal_number_field.pk, 'operator': '>', 'values': {'value': 0.25},
                 'parameter_index': "0"},
            ],
        ])
        self.assert_result_list(json_response, [self.note2, self.note3, self.note5, self.note6])


class MetadataSearchIntegrationTest(
    SearchTestMixin, APITestCase,
    TaskMixin, LabBookMixin, DmpsMixin, ContactMixin, MeetingMixin, PictureMixin, FileMixin
):
    """
    Checks that all required workbench entities can be found using the metadata search
    """

    def test_task(self):
        task, response = self.create_task_orm(
            self.token, self.project.pk,
            "MyTaskTitle", "MyTaskDescription", Task.TASK_STATE_NEW, Task.TASK_PRIORITY_NORMAL,
            datetime.now(), datetime.now(), [],
            **http_info
        )
        self.assert_entity_can_be_found(task, 'tasks')

    def test_note(self):
        note = self.create_note("MyNote")
        self.assert_entity_can_be_found(note, 'notes')

    def test_contact(self):
        contact, response = self.create_contact_orm(
            self.token, self.project.pk, "Dr.", "Max", "Mustermann", "max@muster.om",
            **http_info
        )
        self.assert_entity_can_be_found(contact, 'contacts')

    def test_labbook(self):
        labbook, response = self.create_labbook_orm(
            self.token, self.project.pk, "MyLabBook", False,
            **http_info
        )
        self.assert_entity_can_be_found(labbook, 'labbooks')

    def test_meeting(self):
        meeting, response = self.create_meeting_orm(
            self.token, self.project.pk, "MyMeeting", "MyMeetingDescription", datetime.now(), datetime.now(),
            **http_info
        )
        self.assert_entity_can_be_found(meeting, 'meetings')

    def test_picture(self):
        picture, response = self.create_picture_orm(
            self.token, self.project.pk, "MyPicture", "demo1.png",
            *http_info
        )
        self.assert_entity_can_be_found(picture, 'pictures')

    def test_file(self):
        file, response = self.create_file_orm(
            self.token, self.project.pk, "MyFile", "MyFileDescription", "demo1.txt", 1024,
            **http_info
        )
        self.assert_entity_can_be_found(file, 'files')

    def test_dmp(self):
        dmp_form = DmpForm.objects.create(title="My DMP Form", description="My DMP Form Description")
        DmpFormField.objects.create(
            name="My DMP Form Field 1", type=DmpFormField.TEXTAREA, infotext="My form textarea", dmp_form=dmp_form
        )

        dmp, response = self.create_dmp_orm(
            self.token, self.project.pk, "MyDMP", Dmp.FINAL, dmp_form.pk,
            **http_info
        )
        self.assert_entity_can_be_found(dmp, 'dmps')

    def assert_entity_can_be_found(self, entity, endpoint):
        metadata_value = 1

        self.patch_metadata(
            entity=entity,
            metadata=[{
                'field': self.whole_number_field.pk,
                'values': {
                    'value': metadata_value
                },
                'parameter_index': "0"
            }],
            endpoint=endpoint
        )

        json_response = self.send_search_request([[{
            'field': self.whole_number_field.pk,
            'operator': '=',
            'values': {
                'value': metadata_value
            },
            'parameter_index': "0"
        }]])

        self.assert_result_list(json_response, [entity])


class ModelFilterTest(
    SearchTestMixin, APITestCase,
    TaskMixin, LabBookMixin, DmpsMixin, ContactMixin, MeetingMixin, PictureMixin, FileMixin
):
    """
    Checks that only the selected models are returned when the filter is applied
    """

    def test_search_without_content_type(self):
        self.create_entities_with_metadata()
        json_response = self.search_for_content_type(None)
        self.assert_result_list(json_response, [
            self.task, self.note, self.contact, self.labbook, self.meeting, self.picture, self.file, self.dmp
        ])

    def test_task(self):
        self.create_entities_with_metadata()
        json_response = self.search_for_content_type('task')
        self.assert_result_list(json_response, [self.task])

    def test_note(self):
        self.create_entities_with_metadata()
        json_response = self.search_for_content_type('note')
        self.assert_result_list(json_response, [self.note])

    def test_contact(self):
        self.create_entities_with_metadata()
        json_response = self.search_for_content_type('contact')
        self.assert_result_list(json_response, [self.contact])

    def test_labbook(self):
        self.create_entities_with_metadata()
        json_response = self.search_for_content_type('labbook')
        self.assert_result_list(json_response, [self.labbook])

    def test_meeting(self):
        self.create_entities_with_metadata()
        json_response = self.search_for_content_type('meeting')
        self.assert_result_list(json_response, [self.meeting])

    def test_picture(self):
        self.create_entities_with_metadata()
        json_response = self.search_for_content_type('picture')
        self.assert_result_list(json_response, [self.picture])

    def test_file(self):
        self.create_entities_with_metadata()
        json_response = self.search_for_content_type('file')
        self.assert_result_list(json_response, [self.file])

    def test_dmp(self):
        self.create_entities_with_metadata()
        json_response = self.search_for_content_type('dmp')
        self.assert_result_list(json_response, [self.dmp])

    def search_for_content_type(self, content_type):
        return self.send_search_request(
            [[{
                'field': self.whole_number_field.pk,
                'operator': '=',
                'values': {
                    'value': 1
                },
                'parameter_index': "0"
            }]],
            content_type=content_type
        )

    def create_entities_with_metadata(self):
        # create various models
        self.task, response = self.create_task_orm(
            self.token, self.project.pk,
            "MyTaskTitle", "MyTaskDescription", Task.TASK_STATE_NEW, Task.TASK_PRIORITY_NORMAL,
            datetime.now(), datetime.now(), [],
            **http_info
        )
        self.add_metadata_to_entity(self.task, 'tasks')

        self.note = self.create_note("MyNote")
        self.add_metadata_to_entity(self.note, 'notes')

        self.contact, response = self.create_contact_orm(
            self.token, self.project.pk, "Dr.", "Max", "Mustermann", "max@muster.om",
            **http_info
        )
        self.add_metadata_to_entity(self.contact, 'contacts')

        self.labbook, response = self.create_labbook_orm(
            self.token, self.project.pk, "MyLabBook", False,
            **http_info
        )
        self.add_metadata_to_entity(self.labbook, 'labbooks')

        self.meeting, response = self.create_meeting_orm(
            self.token, self.project.pk, "MyMeeting", "MyMeetingDescription", datetime.now(), datetime.now(),
            **http_info
        )
        self.add_metadata_to_entity(self.meeting, 'meetings')

        self.picture, response = self.create_picture_orm(
            self.token, self.project.pk, "MyPicture", "demo1.png",
            *http_info
        )
        self.add_metadata_to_entity(self.picture, 'pictures')

        self.file, response = self.create_file_orm(
            self.token, self.project.pk, "MyFile", "MyFileDescription", "demo1.txt", 1024,
            **http_info
        )
        self.add_metadata_to_entity(self.file, 'files')

        dmp_form = DmpForm.objects.create(title="My DMP Form", description="My DMP Form Description")
        DmpFormField.objects.create(
            name="My DMP Form Field 1", type=DmpFormField.TEXTAREA, infotext="My form textarea", dmp_form=dmp_form
        )

        self.dmp, response = self.create_dmp_orm(
            self.token, self.project.pk, "MyDMP", Dmp.FINAL, dmp_form.pk,
            **http_info
        )
        self.add_metadata_to_entity(self.dmp, 'dmps')

    def add_metadata_to_entity(self, entity, endpoint):
        metadata_value = 1

        self.patch_metadata(
            entity=entity,
            metadata=[{
                'field': self.whole_number_field.pk,
                'values': {
                    'value': metadata_value
                },
                'parameter_index': "0"
            }],
            endpoint=endpoint
        )


class ViewableFilterTest(SearchTestMixin, APITestCase):
    def setUp(self):
        # set up some base types
        self.whole_number_field = self.create_field("MyWholeNumber", MetadataField.BASE_TYPE_WHOLE_NUMBER)

        self.metadata_value = 1

        # create entities with equal metadata with different users
        self.user1_token, self.user1_note = self.create_entities_as_user("user1")
        self.user2_token, self.user2_note = self.create_entities_as_user("user2")
        self.user3_token, self.user3_note = self.create_entities_as_user("user3")

    def create_entities_as_user(self, username):
        user, token = self.create_user_and_login(username)
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + token)

        suffix = user.username

        project_title = "project_{}".format(suffix)
        project = self.create_project(token, project_title, "My test project", Project.INITIALIZED, **http_info)

        note_title = "note_{}".format(suffix)
        note, response = self.create_note_orm(token, project.pk, note_title, "MyDescription", **http_info)
        self.assertEqual(response.status_code, HTTP_201_CREATED, response.content.decode())

        metadata = [
            {'field': self.whole_number_field.pk, 'values': {'value': self.metadata_value}, 'parameter_index': "0"},
        ]
        self.patch_metadata(note, metadata, endpoint='notes')

        return token, note

    def test_user2_finds_only_entities_created_by_him(self):
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + self.user2_token)

        json_response = self.send_search_request([[
            {'field': self.whole_number_field.pk, 'operator': '=', 'values': {'value': self.metadata_value},
             'parameter_index': "0"},
        ]])
        self.assert_result_list(json_response, [self.user2_note])

    def test_superuser_finds_all_entities(self):
        superuser, token = self.create_user_and_login("superuser", is_superuser=True)
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + token)

        json_response = self.send_search_request([[
            {'field': self.whole_number_field.pk, 'operator': '=', 'values': {'value': self.metadata_value},
             'parameter_index': "0"},
        ]])
        self.assert_result_list(json_response, [
            self.user1_note, self.user2_note, self.user3_note
        ])
