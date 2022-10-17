#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import logging
from urllib.parse import parse_qs, urlencode, urlparse, urlunparse

from django.contrib.auth import get_user_model

from rest_framework.authentication import TokenAuthentication
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.permissions import SAFE_METHODS

from jwt import PyJWTError
from urllib3.util import Url

from eric.jwt_auth.jwt_token import JWT_URL_PARAM, JWTToken
from eric.jwt_auth.jwt_utils import strip_url_params

LOGGER = logging.getLogger(__name__)


class JWTAuthentication(TokenAuthentication):
    """DRF authentication via JWT token"""

    keyword = "JWT"
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
            raise AuthenticationFailed("Invalid token.") from err

        # validate request path
        request_path = self.request.get_full_path()
        if payload.check_path_params:
            token_path = payload.path
            request_path = self.strip_token_from_url(request_path)
        else:
            token_path = strip_url_params(payload.path)
            request_path = strip_url_params(request_path)

        # compare using Url class to account for acceptable variations
        if Url(token_path) != Url(request_path):
            raise AuthenticationFailed("Invalid path.")

        # check user
        user = get_user_model().objects.filter(pk=payload.user_pk).select_related("userprofile").first()
        if not user:
            raise AuthenticationFailed("Invalid user ID.")

        # check verification token
        if user.userprofile.jwt_verification_token != payload.verification_token:
            raise AuthenticationFailed("Invalid verification token.")

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
