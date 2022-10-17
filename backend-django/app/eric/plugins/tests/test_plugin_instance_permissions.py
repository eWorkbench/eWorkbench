#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#

from rest_framework import status
from rest_framework.test import APITestCase

from eric.plugins.models import Plugin
from eric.plugins.tests.mixins import PluginInstanceMixin


class TestPluginInstancePermissions(APITestCase, PluginInstanceMixin):
    def setUp(self):
        self.user1, self.token1 = self.create_user_and_log_in(groups=["User"], username="user1")
        self.user2, self.token2 = self.create_user_and_log_in(groups=["User"], username="user2")

        self.plugin1 = Plugin.objects.create(
            title="PluginOne",
            short_description="For everyone",
            long_description="",
            user_availability=Plugin.GLOBAL,
            path="test_plugin_path",
        )

        # plugin instance 1 (from user1)
        self.plugin_instance1, response = self.create_plugininstance_orm(
            self.token1,
            title="Plugin of User1",
            plugin=self.plugin1.pk,
            picture_file_name="demo1.png",
            rawdata_file_name="demo1.json",
        )
        self.assert_response_status(response, status.HTTP_201_CREATED)

        # plugin instance 2 (from user2)
        self.plugin_instance2, response = self.create_plugininstance_orm(
            self.token2,
            title="Plugin of User2",
            plugin=self.plugin1.pk,
            picture_file_name="demo2.png",
            rawdata_file_name="demo2.json",
        )
        self.assert_response_status(response, status.HTTP_201_CREATED)

    def test_user_can_access_rawdata_of_viewable_plugin_instances_only(self):
        response = self.rest_get_plugin_instance_rawdata(self.token2, self.plugin_instance2.pk)
        self.assert_response_status(response, status.HTTP_200_OK)

        response = self.rest_get_plugin_instance_rawdata(self.token2, self.plugin_instance1.pk)
        self.assert_response_status(response, status.HTTP_404_NOT_FOUND)

    def test_user_can_access_picture_of_viewable_plugin_instances_only(self):
        response = self.rest_get_plugin_instance_picture(self.token2, self.plugin_instance2.pk)
        self.assert_response_status(response, status.HTTP_200_OK)

        response = self.rest_get_plugin_instance_picture(self.token2, self.plugin_instance1.pk)
        self.assert_response_status(response, status.HTTP_404_NOT_FOUND)

    def test_user_can_get_details_of_viewable_plugin_instances_only(self):
        response = self.rest_get_plugininstance(self.token2, pk=self.plugin_instance2.pk)
        self.assert_response_status(response, status.HTTP_200_OK)

        response = self.rest_get_plugininstance(self.token2, pk=self.plugin_instance1.pk)
        self.assert_response_status(response, status.HTTP_404_NOT_FOUND)

    def test_user_can_query_viewable_plugin_instances_only(self):
        response = self.rest_get_plugininstances(self.token2)
        json_response = self.parse_response(response)
        self.assertEqual(json_response.get("count"), 1)
        response_pk = json_response.get("results")[0].get("pk")
        self.assertEqual(response_pk, str(self.plugin_instance2.pk))
