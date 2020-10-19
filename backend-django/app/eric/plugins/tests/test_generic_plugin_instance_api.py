#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#

from rest_framework.test import APITestCase

from eric.plugins.models import Plugin, PluginInstance
from eric.plugins.tests.mixins import PluginInstanceMixin
from eric.projects.tests.mixin_entity_generic_tests import EntityChangeRelatedProjectTestMixin


class TestGenericPluginInstanceApi(APITestCase, PluginInstanceMixin, EntityChangeRelatedProjectTestMixin):
    entity = PluginInstance

    def setUp(self):
        self.superSetUp()

        # create plugins
        plugin1 = Plugin.objects.create(
            title='My First Plugin',
            short_description='This is a test plugin.',
            long_description='',
            user_availability=Plugin.GLOBAL,
            path='test_plugin_path',
        )
        plugin2 = Plugin.objects.create(
            title='My Second Plugin',
            short_description='This is another test plugin.',
            long_description='Well, hello there!',
            user_availability=Plugin.GLOBAL,
            path='test_plugin_path',
        )

        # data to use when plugin instances are created
        self.data = [{
            'title': "My First Test Plugin Instance",
            'plugin': plugin1.pk
        }, {
            'title': "My Second Test Plugin Instance",
            'plugin': plugin2.pk
        }]
