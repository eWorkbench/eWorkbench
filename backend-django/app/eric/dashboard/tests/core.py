#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import json
import os

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Permission

from rest_framework import status

from eric.core.tests import custom_json_handler

User = get_user_model()


class DashboardMixin:
    """
    Mixin which provides several wrapper methods for the
    api/my/dashboard endpoint
    """

    def rest_get_my_dashboard(self, auth_token, HTTP_USER_AGENT, REMOTE_ADDR):
        """
        REST Wrapper for /api/my/dashboard
        :param auth_token:
        :param HTTP_USER_AGENT:
        :param REMOTE_ADDR:
        :return:
        """
        self.client.credentials(HTTP_AUTHORIZATION="Token " + auth_token)

        return self.client.get("/api/my/dashboard/", HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR)
