#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import json
from contextlib import AbstractContextManager
from datetime import datetime

from django.contrib.auth.models import User, Group
from django.test import TestCase, RequestFactory
from django.utils.timezone import localtime
from django_userforeignkey.request import get_current_request, set_current_request
from rest_framework import status
from rest_framework.status import HTTP_200_OK

from eric.core.tests import HTTP_USER_AGENT, REMOTE_ADDR
from eric.core.utils import remove_none_values_from_dict


class CommonTestMixin:
    """
    Provides functions to process REST responses.
    Intended for use on APITestCases.
    """

    def assert_response_status(self, response, expected_status_code=HTTP_200_OK):
        if hasattr(response, 'content'):
            try:
                response_content = response.content.decode()
            except UnicodeDecodeError:
                response_content = '<could not decode response>'
        else:
            response_content = '<no content (StreamingContent?)>'

        self.assertEqual(
            response.status_code, expected_status_code,
            'Expected={expected} -- {response}'.format(expected=expected_status_code, response=response_content)
        )

    def parse_response(self, response, expected_status_code=HTTP_200_OK):
        self.assert_response_status(response, expected_status_code)
        return json.loads(response.content.decode())

    def set_auth_token(self, auth_token):
        self.client.credentials(
            HTTP_AUTHORIZATION='Token {}'.format(auth_token)
        )

    def set_jwt_token(self, jwt_token):
        self.client.credentials(
            HTTP_AUTHORIZATION='JWT {}'.format(jwt_token)
        )

    @staticmethod
    def create_user(groups=None, **kwargs):
        username = kwargs.get('username')

        # build user data
        user_data = {
            'password': 'mySuperSecretPassword123',
            'email': '{}@test.local'.format(username),
        }
        user_data.update(kwargs)

        # create user
        user = User.objects.create_user(**user_data)
        if groups:
            user.groups.add(*Group.objects.filter(name__in=groups))

        return user

    @staticmethod
    def create_my_user(groups=None, **kwargs):
        username = kwargs.get('username')

        # build user data
        user_data = {
            'password': 'mySuperSecretPassword123',
            'email': '{}@test.local'.format(username),
        }
        user_data.update(kwargs)

        # create user
        from eric.projects.models import MyUser
        user = MyUser.objects.create_user(**user_data)
        if groups:
            user.groups.add(*Group.objects.filter(name__in=groups))

        return user

    def create_user_and_log_in(self, groups=None, **kwargs):
        username = kwargs.get('username')

        if 'password' not in kwargs:
            kwargs['password'] = 'mySuperSecretPassword123'

        if 'email' not in kwargs:
            kwargs['email'] = f'{username}@test.local'

        user = self.create_user(groups, **kwargs)
        token = self.login_as_user(username, kwargs['password'])

        return user, token

    def login_as_user(self, username, password):
        # reset credentials
        self.client.credentials()

        # login
        response = self.client.post(
            '/api/auth/login',
            {
                'username': username,
                'password': password
            },
            HTTP_USER_AGENT=HTTP_USER_AGENT,
            REMOTE_ADDR=REMOTE_ADDR
        )
        response = self.parse_response(response, expected_status_code=status.HTTP_200_OK)

        # extract token from login response
        self.assertTrue('token' in response)
        token = response['token']

        # set credentials
        self.set_auth_token(token)

        return token


def get_paginated_results(data):
    # check if there are 'results' in the data and return that or just return the data as is if not
    if isinstance(data, list):
        return data

    results = data.get('results', None) if isinstance(data, dict) else None
    if results is not None and isinstance(results, list):
        data = results

    return data


def params_dict_to_url_params(params=None, leading_question_mark=True):
    if not params or len(params) <= 0:
        return ''

    key_value_pair_strings = [
        '{}={}'.format(key, value) for key, value in params.items()
    ]
    params_str = '&'.join(key_value_pair_strings)

    return '?' + params_str if leading_question_mark else params_str


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


class FakeRequestUser(AbstractContextManager):
    def __init__(self, user, request=None):
        self.tmp_user = user

        self.request = request
        if self.request is None:
            self.request = get_current_request()

        self.original_user = getattr(self.request, 'user', None)

    def __enter__(self):
        self.request.user = self.tmp_user
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.request.user = self.original_user


class FakeRequest(AbstractContextManager):
    def __init__(self, request=None):
        self.original_request = get_current_request()
        self.tmp_request = request
        if request is None:
            self.tmp_request = RequestFactory().request(**{})

    def __enter__(self):
        set_current_request(self.tmp_request)
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        set_current_request(self.original_request)


def as_aware_dt(dt):
    """ Transforms a naive datetime object into an aware datetime object of the current timezone. """

    return localtime().replace(
        year=dt.year, month=dt.month, day=dt.day,
        hour=dt.hour, minute=dt.minute, second=dt.second,
        microsecond=dt.microsecond,
    )


def aware_dt(year, month=1, day=1, hour=0, minute=0, second=0, microsecond=0):
    """ Creates an aware datetime object of the current timezone. """

    return as_aware_dt(
        datetime(year, month, day, hour, minute, second, microsecond)
    )


def naive_dt(year, month=1, day=1, hour=0, minute=0, second=0, microsecond=0):
    """
    Creates a naive datetime that has no timezone information.
    This is the expected format of the REST API.
    """

    return datetime(year, month, day, hour, minute, second, microsecond)
