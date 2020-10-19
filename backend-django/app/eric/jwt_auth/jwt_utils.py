#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import uuid

from django.conf import settings
from django.utils.timezone import datetime, timedelta

from eric.jwt_auth.jwt_token import JWTPayload, JWTToken, EXPIRY_DATE_KEY


def build_jwt_token(user, path: str, **kwargs):
    """
    Creates a token that can be used for authenticating via JWT.
    The token is valid for a specific user and URL path only.
    """

    payload = JWTPayload.create(path, user, **kwargs)
    token = JWTToken.encode(payload)
    return token.token_string


def build_expiring_jwt_token(user, path: str, validity: timedelta = None):
    if not validity:
        default_setting = settings.JWT_AUTH_SETTINGS['default_expiring_token_validity_in_hours']
        validity = timedelta(hours=default_setting)

    expiry_date = datetime.now() + validity

    return build_jwt_token(user, path, **{EXPIRY_DATE_KEY: expiry_date})


def build_jwt_url(request, path: str, token=None):
    """ Builds a JWT url for a given path """

    absolute_url = request.build_absolute_uri(path)
    token = token or build_jwt_token(request.user, path)
    jwt_url = add_url_params(absolute_url, jwt=token)

    return jwt_url


def build_expiring_jwt_url(request, path: str, validity: timedelta = None):
    token = build_expiring_jwt_token(request.user, path, validity)
    return build_jwt_url(request, path, token)


def strip_url_params(url: str):
    if len(url) <= 0:
        return ''

    if '?' not in url:
        return url

    question_mark_index = url.index('?')

    if question_mark_index == 0:
        # question mark is first character -> path contains params only
        return ''
    else:
        return url[0:question_mark_index]


def add_url_params(url: str, **kwargs):
    prefix = '&' if '?' in url else '?'

    for key, value in kwargs.items():
        url = f'{url}{prefix}{key}={value}'
        prefix = '&'

    return url


def generate_random_jwt_verification_token():
    return uuid.uuid4().hex
