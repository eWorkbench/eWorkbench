#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from typing import Set

from django.contrib.auth.models import Group, Permission
from rest_framework import status
from rest_framework.test import APITestCase

from eric.plugins.models import Plugin, PluginInstance
from eric.plugins.tests.mixins import PluginInstanceMixin


class TestPluginInstanceCreatePermission(APITestCase, PluginInstanceMixin):
    def setUp(self):
        self.superuser, self.superuser_token = self.create_user_and_log_in(username='superuser', is_superuser=True)
        self.user1, self.token1 = self.create_user_and_log_in(groups=['User'], username='user1')
        self.user2, self.token2 = self.create_user_and_log_in(groups=['External'], username='external1')
        self.user3, self.token3 = self.create_user_and_log_in(groups=['Student'], username='student1')
        self.user4, self.token4 = self.create_user_and_log_in(groups=['User', 'Student'], username='userStudent1')
        self.user5, self.token5 = self.create_user_and_log_in(groups=[], username='noGroupUser1')

        self.add_plugininstance_without_project_permission = Permission.objects.filter(
            codename='add_plugininstance_without_project',
            content_type=PluginInstance.get_content_type()
        ).first()

        # now give users the global add plugininstance without project permission
        self.user2.user_permissions.add(self.add_plugininstance_without_project_permission)
        self.user5.user_permissions.add(self.add_plugininstance_without_project_permission)

        self.plugin1 = Plugin.objects.create(
            title='PluginOne',
            short_description='For everyone',
            long_description='',
            user_availability=Plugin.GLOBAL,
            path='test_plugin_path',
        )

        self.plugin2 = Plugin.objects.create(
            title='PluginTwo',
            short_description='For students only',
            user_availability=Plugin.SELECTED_USERS,
            path='test_plugin_path',
        )
        self.plugin2.user_availability_selected_user_groups.add(Group.objects.get(name='Student'))

        self.plugin3 = Plugin.objects.create(
            title='PluginThree',
            short_description='For users only',
            user_availability=Plugin.SELECTED_USERS,
            path='test_plugin_path',
        )
        self.plugin3.user_availability_selected_user_groups.add(Group.objects.get(name='User'))

        self.plugin4 = Plugin.objects.create(
            title='PluginFour',
            short_description='For no one',
            user_availability=Plugin.SELECTED_USERS,
            path='test_plugin_path',
        )

        self.plugin5 = Plugin.objects.create(
            title='PluginFive',
            short_description='For user 2+5 only',
            user_availability=Plugin.SELECTED_USERS,
            path='test_plugin_path',
        )
        self.plugin5.user_availability_selected_users.add(self.user2, self.user5)

        self.all_plugins = {
            self.plugin1,
            self.plugin2,
            self.plugin3,
            self.plugin4,
            self.plugin5,
        }

    def test_users_can_create_plugin_instances_with_access_only(self):
        # plugin1: Global
        # plugin2: Student
        # plugin3: User
        # plugin4: -
        # plugin5: User2+5

        # user1: User
        self.assert_can_create_instance_of_exact_plugins(self.token1, allowed_plugins={
            self.plugin1,
            self.plugin3
        })

        # user2: External
        self.assert_can_create_instance_of_exact_plugins(self.token2, allowed_plugins={
            self.plugin1,
            self.plugin5
        })

        # user3: Student
        self.assert_can_create_instance_of_exact_plugins(self.token3, allowed_plugins={
            self.plugin1,
            self.plugin2,
        })

        # user4: User, Student
        self.assert_can_create_instance_of_exact_plugins(self.token4, allowed_plugins={
            self.plugin1,
            self.plugin2,
            self.plugin3,
        })

        # user5: -
        self.assert_can_create_instance_of_exact_plugins(self.token5, allowed_plugins={
            self.plugin1,
            self.plugin5,
        })

        # Superuser
        self.assert_can_create_instance_of_exact_plugins(self.superuser_token, allowed_plugins=self.all_plugins)

    def assert_can_create_instance_of_exact_plugins(self, auth_token: str, allowed_plugins: Set[Plugin]):
        for plugin in allowed_plugins:
            self.assert_can_create_instance_of_plugin(auth_token, plugin)

        forbidden_plugins = self.all_plugins.difference(allowed_plugins)
        for plugin in forbidden_plugins:
            self.assert_can_not_create_instance_of_plugin(auth_token, plugin)

    def assert_can_create_instance_of_plugin(self, auth_token, plugin: Plugin):
        response = self.rest_create_plugininstance(auth_token, plugin=plugin.pk, title='My Plugin')
        self.assertEqual(
            response.status_code, status.HTTP_201_CREATED,
            'Should be able to create plugin instance of plugin "{}" -- {}'.format(plugin.title,
                                                                                   response.content.decode())
        )

    def assert_can_not_create_instance_of_plugin(self, auth_token, plugin: Plugin):
        response = self.rest_create_plugininstance(auth_token, plugin=plugin.pk, title='My Plugin')
        self.assertEqual(
            response.status_code, status.HTTP_403_FORBIDDEN,
            'Should NOT be able to create plugin "{}" -- {}'.format(plugin.title, response.content.decode())
        )
