#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import json

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group

from rest_framework import status
from rest_framework.test import APITestCase

from eric.projects.tests.core import AuthenticationMixin
from eric.settings.base import PUBLIC_USER_GROUPS

HTTP_USER_AGENT = "APITestClient"
REMOTE_ADDR = "127.0.0.1"

User = get_user_model()


class TestPublicUserGroups(APITestCase, AuthenticationMixin):
    """
    Extensive testing of public user groups endpoint
    """

    def setUp(self):
        """
        Set up a test user and all required user groups
        """
        # create test user
        self.test_user = User.objects.create_user(username="user", email="test@email.com", password="password")

        # check if all public user groups have been created
        for group in PUBLIC_USER_GROUPS:
            Group.objects.get_or_create(name=group)

        # create a random user group which should not be returned by the API endpoint
        Group.objects.get_or_create(name="Random")

    def test_rest_get_public_user_groups(self):
        """
        Test the user groups endpoint
        """
        auth_token = self.login_and_return_token(self.test_user.username, "password", HTTP_USER_AGENT, REMOTE_ADDR)
        self.client.credentials(HTTP_AUTHORIZATION="Token " + auth_token)

        response = self.client.get("/api/usergroups/", HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # check if the count of public user groups is correct
        decoded = json.loads(response.content.decode())
        self.assertEqual(len(decoded), len(PUBLIC_USER_GROUPS))

        # check if only the configured public user groups are returned
        for user_group in decoded:
            self.assertIn(user_group["name"], PUBLIC_USER_GROUPS)
