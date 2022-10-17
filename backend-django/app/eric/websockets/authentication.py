#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.test import RequestFactory

from rest_framework.exceptions import AuthenticationFailed
from rest_framework.settings import api_settings

authenticators = [auth() for auth in api_settings.DEFAULT_AUTHENTICATION_CLASSES]


def fake_rest_auth(auth_token, scope, *args, **kwargs):
    user = None
    auth = None
    request = None

    if auth_token:
        request_headers = dict()
        request_headers["REQUEST_METHOD"] = "GET"

        # scope["headers"] contains a list of tuples, where each tuple is header_name + header_title
        for (header_name, header_value) in scope["headers"]:
            # decode the header_name, uppercase it, and replace all - by _
            header_name = header_name.decode().upper().replace("-", "_")
            # prepend HTTP_ to the header name
            request_headers["HTTP_" + header_name] = header_value.decode()

        # add authorization header for rest framework
        request_headers["HTTP_AUTHORIZATION"] = f"Token {auth_token}"

        # create a fake request
        request = RequestFactory().request(**request_headers)

        # try each authenticator
        for authenticator in authenticators:
            user_auth_tuple = None

            try:
                user_auth_tuple = authenticator.authenticate(request)
            except AuthenticationFailed:
                pass

            if user_auth_tuple is not None:
                user, auth = user_auth_tuple
                request.user = user
                break

    return user, auth, request
