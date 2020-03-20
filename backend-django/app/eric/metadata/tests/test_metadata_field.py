#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import json

from django.conf import settings
from django.core import mail
from rest_framework.status import HTTP_400_BAD_REQUEST, HTTP_200_OK
from rest_framework.test import APITestCase

from eric.metadata.models.models import MetadataField
from eric.metadata.tests.rest_mixin import MetadataFieldRestRequestBuilder
from eric.projects.tests.core import AuthenticationMixin, ProjectsMixin, ModelPrivilegeMixin
from eric.shared_elements.tests.core import TaskMixin
from eric.versions.tests.helper_mixin import HelperMixin


def api_data(name, description, base_type, type_settings):
    return {
        'type_settings': type_settings,
        'base_type': base_type,
        'description': description,
        'name': name,
    }


class MetadataFieldAPITest(
    APITestCase,
    AuthenticationMixin, ModelPrivilegeMixin, HelperMixin, ProjectsMixin, TaskMixin
):
    """ Tests the metadata-fields API """

    def setUp(self):
        self.superuser, self.token = self.create_user_and_login("superuser", is_superuser=True)
        self.request_builder = MetadataFieldRestRequestBuilder(self).as_user(self.token)

    def test_post_and_get_list(self):
        # check that there are no fields
        response = self.request_builder.get_list()
        json_response = json.loads(response.content.decode())
        self.assertEqual(len(json_response), 0)

        # create a metadata field
        self.request_builder.post(api_data('MyGPS', 'GPS data', MetadataField.BASE_TYPE_GPS, {}))
        response = self.request_builder.get_list()
        json_response = json.loads(response.content.decode())
        self.assertEqual(len(json_response), 1)

        # get it from the API and check it's contents
        gps_list_response = self.request_builder.get_list()
        gps_list = json.loads(gps_list_response.content.decode())
        self.assertEqual(len(gps_list), 1)
        gps_response = gps_list[0]
        self.assertEqual(gps_response['name'], 'MyGPS')
        self.assertEqual(gps_response['description'], 'GPS data')
        self.assertEqual(gps_response['base_type'], MetadataField.BASE_TYPE_GPS)
        self.assertEqual(gps_response['type_settings'], {})

        # post some more fields
        self.request_builder.post(api_data(
            'MyFraction', 'x/y', MetadataField.BASE_TYPE_FRACTION, {}))
        self.request_builder.post(api_data(
            'MyDecimal', 'x.y', MetadataField.BASE_TYPE_DECIMAL_NUMBER, {'decimals': 3}
        ))

        # check there are more now
        response = self.request_builder.get_list()
        json_response = json.loads(response.content.decode())
        self.assertEqual(len(json_response), 3)

    def test_invalid_base_type(self):
        self.request_builder.post(
            api_data('MyNewField', 'Description', -123, {}),
            assert_status=HTTP_400_BAD_REQUEST)

    def test_post_new_metadata_without_add_permission(self):
        # login as user without any permissions
        user, token = self.create_user_and_login("simpleUser")
        self.request_builder.as_user(token)

        # check that there are no fields
        response = self.request_builder.get_list()
        json_response = json.loads(response.content.decode())
        self.assertEqual(len(json_response), 0)

        # post a metadata field
        response = self.request_builder.post(
            api_data('MyGPS', 'GPS data', MetadataField.BASE_TYPE_GPS, {}),
            assert_status=HTTP_200_OK
        )
        json_response = json.loads(response.content.decode())
        self.assertTrue('request_status' in json_response)
        self.assertEqual(json_response['request_status'], 'sent')

        # check that the field was not added
        response = self.request_builder.get_list()
        json_response = json.loads(response.content.decode())
        self.assertEqual(len(json_response), 0)

        # check that a new-metadata-field-request mail was sent
        self.assertEqual(len(mail.outbox), 1)
        email = mail.outbox[0]
        self.assertEqual(len(email.to), 1)
        self.assertEqual(email.to[0], settings.EMAIL_RECIPIENT_FOR_NEW_METADATA_FIELDS)

    def test_post_invalid_data_without_add_permission(self):
        # login as user without any permissions
        user, token = self.create_user_and_login("simpleUser")
        self.request_builder.as_user(token)

        # check that there are no fields
        response = self.request_builder.get_list()
        json_response = json.loads(response.content.decode())
        self.assertEqual(len(json_response), 0)

        # post a metadata field
        self.request_builder.post(
            api_data(name='mdf1', description='mdf1-desc', base_type='in-va-lid', type_settings={}),
            assert_status=HTTP_400_BAD_REQUEST
        )

        # check that the field was not added
        response = self.request_builder.get_list()
        json_response = json.loads(response.content.decode())
        self.assertEqual(len(json_response), 0)

        # check that no new-metadata-field-request mail was sent
        self.assertEqual(len(mail.outbox), 0)

    def test_post_without_base_type(self):
        self.request_builder.post(
            {
                'type_settings': {},
                'description': 'no base type',
                'name': 'NoBaseType',
            },
            assert_status=HTTP_400_BAD_REQUEST
        )

    def test_post_selection_without_answers(self):
        self.request_builder.post(
            {
                'type_settings': {
                    'answers': [
                    ]
                },
                'base_type': MetadataField.BASE_TYPE_SELECTION,
                'description': 'test description text',
                'name': 'TestField',
            },
            assert_status=HTTP_400_BAD_REQUEST
        )

    def test_post_selection_with_empty_answer(self):
        self.request_builder.post(
            {
                'type_settings': {
                    'answers': [
                        ''
                    ]
                },
                'base_type': MetadataField.BASE_TYPE_SELECTION,
                'description': 'test description text',
                'name': 'TestField',
            },
            assert_status=HTTP_400_BAD_REQUEST
        )

    def test_post_selection_with_whitespace_answer(self):
        for whitespace in ['\t', '\n', ' ', '   ', ]:
            self.request_builder.post(
                {
                    'type_settings': {
                        'answers': [
                            whitespace,
                        ]
                    },
                    'base_type': MetadataField.BASE_TYPE_SELECTION,
                    'description': 'test description text',
                    'name': 'TestField',
                },
                assert_status=HTTP_400_BAD_REQUEST
            )

    def test_post_selection_with_duplicate_answers(self):
        self.request_builder.post(
            {
                'type_settings': {
                    'answers': [
                        'alkdsfs',
                        'aoiajf9829322 j 89j89 893  ()UR ()23429 ()§(§',
                        'bbbb',
                        'c c c c ',
                        'aoiajf9829322 j 89j89 893  ()UR ()23429 ()§(§',
                    ]
                },
                'base_type': MetadataField.BASE_TYPE_SELECTION,
                'description': 'test description text',
                'name': 'TestField',
            },
            assert_status=HTTP_400_BAD_REQUEST
        )

    def test_post_decimal_number_without_decimal_places(self):
        self.request_builder.post(
            {
                'type_settings': {
                    'decimals': 0
                },
                'base_type': MetadataField.BASE_TYPE_DECIMAL_NUMBER,
                'description': 'test description text',
                'name': 'TestField',
            },
            assert_status=HTTP_400_BAD_REQUEST
        )

    def test_post_negative_decimals_setting(self):
        self.request_builder.post(
            {
                'type_settings': {
                    'decimals': -1
                },
                'base_type': MetadataField.BASE_TYPE_CURRENCY,
                'description': 'test description text',
                'name': 'TestField',
            },
            assert_status=HTTP_400_BAD_REQUEST
        )

        self.request_builder.post(
            {
                'type_settings': {
                    'decimals': -1
                },
                'base_type': MetadataField.BASE_TYPE_PERCENTAGE,
                'description': 'test description text',
                'name': 'TestField',
            },
            assert_status=HTTP_400_BAD_REQUEST
        )
