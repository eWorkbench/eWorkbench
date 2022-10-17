#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.contrib.auth.models import Group

from rest_framework import status
from rest_framework.test import APITestCase

from eric.core.tests.test_utils import CommonTestMixin
from eric.plugins.models import Plugin
from eric.plugins.tests.mixins import PluginMixin


class TestPluginPermissions(APITestCase, PluginMixin, CommonTestMixin):
    """Tests the plugin API permissions"""

    def setUp(self):
        self.superuser, self.superuser_token = self.create_user_and_log_in(username="superuser", is_superuser=True)
        self.user1, self.token1 = self.create_user_and_log_in(groups=["User"], username="user1")
        self.user2, self.token2 = self.create_user_and_log_in(groups=["External"], username="external1")
        self.user3, self.token3 = self.create_user_and_log_in(groups=["Student"], username="student1")
        self.user4, self.token4 = self.create_user_and_log_in(groups=["User", "Student"], username="userStudent1")
        self.user5, self.token5 = self.create_user_and_log_in(groups=[], username="noGroupUser1")

        self.plugin1 = Plugin.objects.create(
            title="PluginOne",
            short_description="For everyone",
            long_description="",
            user_availability=Plugin.GLOBAL,
            path="test_plugin_path",
        )

        self.plugin2 = Plugin.objects.create(
            title="PluginTwo",
            short_description="For students only",
            user_availability=Plugin.SELECTED_USERS,
            path="test_plugin_path",
        )
        self.plugin2.user_availability_selected_user_groups.add(Group.objects.get(name="Student"))

        self.plugin3 = Plugin.objects.create(
            title="PluginThree",
            short_description="For users only",
            user_availability=Plugin.SELECTED_USERS,
            path="test_plugin_path",
        )
        self.plugin3.user_availability_selected_user_groups.add(Group.objects.get(name="User"))

        self.plugin4 = Plugin.objects.create(
            title="PluginFour",
            short_description="For no one",
            user_availability=Plugin.SELECTED_USERS,
            path="test_plugin_path",
        )

        self.plugin5 = Plugin.objects.create(
            title="PluginFive",
            short_description="For user 2+5 only",
            user_availability=Plugin.SELECTED_USERS,
            path="test_plugin_path",
        )
        self.plugin5.user_availability_selected_users.add(self.user2, self.user5)

    def test_everyone_can_GET_complete_plugin_list(self):
        self.assert_user_can_read_all_plugins(self.token1)
        self.assert_user_can_read_all_plugins(self.token2)
        self.assert_user_can_read_all_plugins(self.token3)
        self.assert_user_can_read_all_plugins(self.token4)
        self.assert_user_can_read_all_plugins(self.token5)
        self.assert_user_can_read_all_plugins(self.superuser_token)

    def assert_user_can_read_all_plugins(self, token):
        response = self.rest_get_plugin_list(token, params={"onlyPluginsWithAccess": False})
        response = self.parse_response(response, expected_status_code=status.HTTP_200_OK)
        self.assertEqual(len(response), 5)

    def test_accessible_plugins_are_returned(self):
        # plugin1: Global
        # plugin2: Student
        # plugin3: User
        # plugin4: -
        # plugin5: User2+5

        # user1: User
        self.assert_listed_plugins_for_user(self.token1, [self.plugin1, self.plugin3])

        # user2: External
        self.assert_listed_plugins_for_user(self.token2, [self.plugin1, self.plugin5])

        # user3: Student
        self.assert_listed_plugins_for_user(self.token3, [self.plugin1, self.plugin2])

        # user4: User, Student
        self.assert_listed_plugins_for_user(self.token4, [self.plugin1, self.plugin2, self.plugin3])

        # user5: -
        self.assert_listed_plugins_for_user(self.token5, [self.plugin1, self.plugin5])

        # Superuser
        self.assert_listed_plugins_for_user(
            self.superuser_token, [self.plugin1, self.plugin2, self.plugin3, self.plugin4, self.plugin5]
        )

    def assert_listed_plugins_for_user(self, token, expected_plugins):
        response = self.rest_get_plugin_list(token)
        response = self.parse_response(response, expected_status_code=status.HTTP_200_OK)
        expected_pks = {str(plugin.pk) for plugin in expected_plugins}
        response_pks = {plugin["pk"] for plugin in response}
        self.assertEqual(expected_pks, response_pks)
