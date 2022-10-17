#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import json

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group, Permission
from django.core.exceptions import ValidationError
from django.utils.timezone import datetime, timedelta

from rest_framework import status
from rest_framework.test import APITestCase

from eric.site_preferences.models import GenericConfiguration

User = get_user_model()


HTTP_USER_AGENT = "APITestClient"
REMOTE_ADDR = "127.0.0.1"


class SitePreferencesTest(APITestCase):
    """
    Tests the /api/site_preferences endpoint
    """

    def setUp(self):
        """Set up a couple of users and roles and projects"""
        pass

    def rest_get_site_preferences(self):
        self.client.credentials(HTTP_AUTHORIZATION="")

        return self.client.get("/api/site_preferences/", HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR)

    def test_get_site_preferences(self):
        """
        Access the /api/site_preferences endpoint and verifies that site_logo and site_name are available
        :return:
        """
        response = self.rest_get_site_preferences()
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        decoded = json.loads(response.content.decode())

        self.assertTrue("site_logo" in decoded)
        self.assertTrue("site_name" in decoded)
