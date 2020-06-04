#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import json

from django.test import TestCase
from rest_framework.status import HTTP_200_OK

from eric.core.utils import remove_none_values_from_dict


class TestResponseMixin:
    """
    Provides functions to process REST responses.
    Intended for use on APITestCases.
    """

    def check_response_status(self, response, expected_status_code=HTTP_200_OK):
        self.assertEqual(response.status_code, expected_status_code, response.content.decode())

    def load_response(self, response, expected_status_code=HTTP_200_OK):
        self.check_response_status(response, expected_status_code)
        return json.loads(response.content.decode())


def get_paginated_results(data):
    # check if there are 'results' in the data and return that or just return the data as is if not
    if isinstance(data, dict):
        results = data.get('results', None)
    if results or results == []:
        data = results
    return data


class CoreUtilsTest(TestCase):

    def test_remove_none_values_from_dict(self):
        test_dict = {
            'key1': 'value1',
            'key2': 'value2',
            'key3': 'value3',
            'keyNone': None,
        }
        clean_dict = remove_none_values_from_dict(test_dict)
        self.assertNotEqual(test_dict, clean_dict)
        self.assertEqual(len(clean_dict), 3)
