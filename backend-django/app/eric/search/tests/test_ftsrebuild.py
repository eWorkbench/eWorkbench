#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.core.management import call_command

from rest_framework.test import APITestCase

from eric.projects.tests.core import AuthenticationMixin
from eric.search.tests.core import FTSDataMixin

User = get_user_model()


class FTSRebuildTest(APITestCase, AuthenticationMixin, FTSDataMixin):
    """Extensive testing of ftsrebuild command"""

    # set up users
    def setUp(self):
        """set up a couple of users"""
        # get user group
        self.user_group = Group.objects.get(name="User")

        # create users and assign them to the user group
        self.user1 = User.objects.create_user(username="student_1", email="student_1@email.com", password="top_secret")
        self.user1.groups.add(self.user_group)

    def test_ftsrebuild(self):
        http_user_agent = "APITestClient"
        http_remote_addr = "127.0.0.1"

        auth_token = self.login_and_return_token(self.user1.username, "top_secret", http_user_agent, http_remote_addr)
        projects = self.create_test_projects(auth_token)

        # asserts the projects do have a filled fts_index
        self.assertEqual(len([p for p in projects.all() if p.fts_index]), 3)

        projects.update(fts_index="")

        # asserts the projects do have no filled fts_index
        self.assertEqual(len([p for p in projects.all() if p.fts_index]), 0)

        # call the ftsrebuild management command
        call_command("ftsrebuild")

        # asserts the projects do have a filled fts_index again
        self.assertEqual(len([p for p in projects.all() if p.fts_index]), 3)
