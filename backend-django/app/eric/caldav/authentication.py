#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.contrib.auth import authenticate
from django.contrib.auth.models import AnonymousUser
from django_userforeignkey.request import get_current_request


def is_authenticated(user, password):
    user = authenticate(username=user, password=password)
    request = get_current_request()

    if user is not None:
        if user.is_active:
            # make sure to set the current user on the current request
            request.user = user
            return True

    request.user = AnonymousUser()
    return False
