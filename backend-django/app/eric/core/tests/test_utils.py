#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import json

from rest_framework.status import HTTP_200_OK


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
