#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import json

from django.contrib.auth import get_user_model

from rest_framework import status
from rest_framework.test import APITestCase

from django_rest_multitokenauth.models import MultiToken

from eric.cms.models import AcceptedScreen, LaunchScreen
from eric.cms.tests.core import AcceptedScreenMixin, LaunchScreenMixin
from eric.core.models import disable_permission_checks
from eric.core.tests import HTTP_USER_AGENT, REMOTE_ADDR
from eric.core.tests.test_utils import CommonTestMixin
from eric.projects.tests.core import AuthenticationMixin

User = get_user_model()


class LaunchScreenTest(
    APITestCase,
    AuthenticationMixin,
    LaunchScreenMixin,
    AcceptedScreenMixin,
    CommonTestMixin,
):
    def setUp(self):
        launch_screen1 = LaunchScreen(title="Title1", text="Text1", version="1.0.0", show_screen=True)
        launch_screen1.save()

        launch_screen2 = LaunchScreen(title="Title2", text="Text2", version="1.0.0", show_screen=False)
        launch_screen2.save()

        self.testuser1, self.token1 = self.create_user_and_log_in(
            groups=["User"], username="testuser1", password="top_secret"
        )
        self.testuser2, self.token2 = self.create_user_and_log_in(
            groups=["User"], username="testuser2", password="other_top_secret"
        )

    def test_launch_screens(self):
        response = self.rest_get_launch_screens(self.token1, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        decoded = json.loads(response.content.decode())
        self.assertEqual(decoded["count"], 1)

        self.assertEqual(MultiToken.objects.all().count(), 2)

        launch_screen = LaunchScreen.objects.filter(title="Title2").first()
        launch_screen.show_screen = True
        with disable_permission_checks(LaunchScreen):
            launch_screen.save()

        self.assertEqual(MultiToken.objects.all().count(), 0)

        response = self.rest_create_accepted_screen(
            self.token1,
            launch_screen.pk,
            launch_screen.version,
            launch_screen.last_modified_at,
            HTTP_USER_AGENT,
            REMOTE_ADDR,
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

        self.token1 = self.login_as_user(username="testuser1", password="top_secret")

        response = self.rest_get_launch_screens(self.token1, HTTP_USER_AGENT, REMOTE_ADDR)
        decoded = json.loads(response.content.decode())
        self.assertEqual(decoded["count"], 2)

        launch_screen = LaunchScreen.objects.filter(title="Title2").first()
        response = self.rest_create_accepted_screen(
            auth_token=self.token1,
            launch_screen_pk=launch_screen.pk,
            version=launch_screen.version,
            timestamp=launch_screen.last_modified_at,
            HTTP_USER_AGENT=HTTP_USER_AGENT,
            REMOTE_ADDR=REMOTE_ADDR,
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        response = self.rest_get_launch_screens(self.token1, HTTP_USER_AGENT, REMOTE_ADDR)
        decoded = json.loads(response.content.decode())
        self.assertEqual(decoded["count"], 1)

        launch_screen = LaunchScreen.objects.filter(title="Title2").first()
        launch_screen.text = "Another text"
        with disable_permission_checks(LaunchScreen):
            launch_screen.save()

        self.token1 = self.login_as_user(username="testuser1", password="top_secret")

        response = self.rest_get_launch_screens(self.token1, HTTP_USER_AGENT, REMOTE_ADDR)
        decoded = json.loads(response.content.decode())
        self.assertEqual(decoded["count"], 2)
