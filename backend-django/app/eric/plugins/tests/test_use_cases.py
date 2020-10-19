#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.contrib.auth.models import Group
from django.contrib.contenttypes.models import ContentType
from rest_framework import status
from rest_framework.test import APITestCase

from eric.core.tests import HTTP_INFO
from eric.core.tests.test_utils import CommonTestMixin
from eric.labbooks.tests.core import LabBookMixin
from eric.plugins.models import Plugin, PluginInstance
from eric.plugins.tests.mixins import PluginMixin, PluginInstanceMixin


class TestLabBookUseCase(APITestCase, PluginMixin, PluginInstanceMixin, LabBookMixin, CommonTestMixin):
    """ Tests real-life use cases """

    def setUp(self):
        self.user1, self.token1 = self.create_user_and_log_in(groups=['User'], username='user1')
        self.user_group = Group.objects.get(name='User')

        self.plugin1 = Plugin.objects.create(
            title='Plugin One',
            short_description='This is a test plugin with access for the "User" group.',
            long_description='',
            user_availability=Plugin.SELECTED_USERS,
            path='test_plugin_path'
        )
        self.plugin1.user_availability_selected_user_groups.add(self.user_group)

    def test_use_case_plugin_in_labbook(self):
        """ Plugin instance in LabBook """

        # create LabBook
        labbook, response = self.create_labbook_orm(
            self.token1, project_pk=None, title='My LabBook', is_template=False,
            **HTTP_INFO
        )
        self.assert_response_status(response, status.HTTP_201_CREATED)

        # create plugin instance
        response = self.rest_create_plugininstance(self.token1, plugin=self.plugin1.pk, title='Plugin Instance A')
        plugin_instance = self.parse_response(response, expected_status_code=status.HTTP_201_CREATED)

        # add plugin to labbook
        plugin_instance_ct = ContentType.objects.get_for_model(PluginInstance)
        response = self.rest_add_labbook_element(
            self.token1, labbook_pk=labbook.pk,
            child_object_content_type=plugin_instance_ct.pk, child_object_id=plugin_instance['pk'],
            position_x=0, position_y=0, width=5, height=3,
            **HTTP_INFO
        )
        self.assert_response_status(response, status.HTTP_201_CREATED)

        # alter plugin instance (in LabBook)
        self.rest_update_plugininstance(
            self.token1, pk=plugin_instance['pk'],
            picture_file_name='demo1.png', rawdata_file_name='demo1.json'
        )

        # reload LabBook page and check contents
        response = self.rest_get_labbook(self.token1, labbook_pk=labbook.pk, **HTTP_INFO)
        self.assert_response_status(response, status.HTTP_200_OK)
        response = self.rest_get_labbook_elements(self.token1, labbook.pk, **HTTP_INFO)
        self.assertContains(response, plugin_instance['pk'])
        self.assertContains(response, plugin_instance['title'])

        # trash LabBook
        response = self.rest_trash_labbook(self.token1, labbook_pk=labbook.pk, **HTTP_INFO)
        self.assert_response_status(response, expected_status_code=status.HTTP_200_OK)

        # check that the plugin instance is not trashed or deleted
        db_plugin = PluginInstance.objects.get(pk=plugin_instance['pk'])
        self.assertFalse(db_plugin.deleted)

        # user updates plugin instance outside LabBook
        response = self.rest_update_plugininstance(
            self.token1, pk=plugin_instance['pk'],
            picture_file_name='demo2.png', rawdata_file_name='demo2.json'
        )
        self.assert_response_status(response, status.HTTP_200_OK)
