#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import logging
from urllib.parse import urlencode, urlparse, urlunparse, parse_qs

import jwt
from django.conf import settings
from django.contrib.auth import get_user_model
from jwt import PyJWTError, DecodeError
from rest_framework.authentication import TokenAuthentication
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.permissions import SAFE_METHODS
from urllib3.util import Url

USER_MODEL = get_user_model()
LOGGER = logging.getLogger(__name__)

JWT_URL_PARAM = 'jwt'

PATH_KEY = 'path'
VERIFICATION_TOKEN_KEY = 'jwt_verification_token'
USER_PK_KEY = 'user'
EXPIRY_DATE_KEY = 'exp'


class JWTToken:
    algorithms = 'HS256'
    encryption_key = settings.SECRET_KEY

    def __init__(self, token_string: str):
        self.token_string = token_string

    def decode(self) -> 'JWTPayload':
        decoded = jwt.decode(
            jwt=self.token_string,
            key=self.encryption_key,
            algorithms=self.algorithms,
            verify_exp=True,  # verify expiry date ('exp' argument)
        )

        if decoded:
            return JWTPayload(decoded)
        else:
            raise DecodeError('Token could not be decoded.')

    @classmethod
    def encode(cls, payload: 'JWTPayload') -> 'JWTToken':
        token_byte_string = jwt.encode(payload.dict, key=cls.encryption_key, algorithm=cls.algorithms)
        token_string = token_byte_string.decode('utf-8')
        return JWTToken(token_string)


class JWTPayload:
    def __init__(self, payload: dict):
        self.dict = payload

        # required payload
        try:
            self.path = payload.get(PATH_KEY)
            self.user_pk = payload.get(USER_PK_KEY)
            self.verification_token = payload.get(VERIFICATION_TOKEN_KEY)
        except KeyError as err:
            raise DecodeError('Required payload missing from token.', err)

        # optional payload
        self.expiry_date = payload.get(EXPIRY_DATE_KEY, None)

    @classmethod
    def create(cls, path: str, user, exp=None, **kwargs) -> 'JWTPayload':
        payload = {
            PATH_KEY: path,
            USER_PK_KEY: user.pk,
            VERIFICATION_TOKEN_KEY: user.userprofile.jwt_verification_token,
        }

        if exp:
            payload[EXPIRY_DATE_KEY] = exp

        payload.update(kwargs)

        return cls(payload)


class JWTAuthentication(TokenAuthentication):
    """ DRF authentication via JWT token """

    keyword = 'JWT'
    request = None

    def authenticate(self, request):
        """
        Authenticate the request and return a two-tuple of (user, token).
        Looks for the token in the HTTP header and the URL parameters.
        """

        self.request = request

        # check for URL parameter in case of SAFE request method (read-only)
        if request.method in SAFE_METHODS and JWT_URL_PARAM in request.GET:
            jwt_token = request.GET.get(JWT_URL_PARAM)
            return self.authenticate_credentials(jwt_token)

        # check for token in HTTP header
        return super().authenticate(request)

    def authenticate_credentials(self, key):
        try:
            token = JWTToken(key)
            payload = token.decode()
        except PyJWTError as err:
            raise AuthenticationFailed('Invalid token.') from err

        # validate request path
        request_path = self.request.get_full_path()
        request_path_without_token = self.strip_token_from_url(request_path)
        # compare using Url class to account for acceptable variations
        if Url(payload.path) != Url(request_path_without_token):
            raise AuthenticationFailed('Invalid path.')

        # check user
        user = USER_MODEL.objects.filter(pk=payload.user_pk).select_related('userprofile').first()
        if not user:
            raise AuthenticationFailed('Invalid user ID.')

        # check verification token
        if user.userprofile.jwt_verification_token != payload.verification_token:
            raise AuthenticationFailed('Invalid verification token.')

        return user, key

    @staticmethod
    def strip_token_from_url(url: str) -> str:
        params_index = 4
        url_parts = list(urlparse(url))
        query_dict = parse_qs(url_parts[params_index], keep_blank_values=True)
        if JWT_URL_PARAM in query_dict:
            del query_dict[JWT_URL_PARAM]

        url_parts[params_index] = urlencode(query_dict, doseq=True)
        return urlunparse(url_parts)
