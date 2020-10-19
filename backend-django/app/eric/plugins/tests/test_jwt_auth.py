from datetime import timedelta, datetime
from urllib.parse import urlparse, parse_qs

import time_machine
from django.conf import settings
from django.contrib.auth.models import Permission
from django.http import FileResponse
from rest_framework import status
from rest_framework.test import APITestCase

from eric.core.tests import HTTP_INFO, HTTP_USER_AGENT, REMOTE_ADDR
from eric.core.tests.test_utils import CommonTestMixin
from eric.jwt_auth.jwt_utils import generate_random_jwt_verification_token
from eric.plugins.models import Plugin, PluginInstance
from eric.plugins.tests.mixins import PluginInstanceMixin, PluginMixin
from eric.projects.tests.core import AuthenticationMixin


class JWTAuthTest(APITestCase, PluginMixin, PluginInstanceMixin, AuthenticationMixin, CommonTestMixin):
    def setUp(self):
        self.superuser, self.superuser_token = self.create_user_and_log_in(username='superuser', is_superuser=True)
        self.user1, self.token1 = self.create_user_and_log_in(groups=['User'], username='user1')

        self.add_plugininstance_without_project_permission = Permission.objects.filter(
            codename='add_plugininstance_without_project',
            content_type=PluginInstance.get_content_type()
        ).first()

        self.user1.user_permissions.add(self.add_plugininstance_without_project_permission)

        self.plugin1 = Plugin.objects.create(
            title='PluginOne',
            short_description='For everyone',
            long_description='',
            user_availability=Plugin.GLOBAL,
            path='test_plugin_path',
        )

        self.plugin_instance1, response = self.create_plugininstance_orm(
            self.token1,
            title='My First Plugin Instance',
            plugin=self.plugin1.pk
        )

        self.plugin_instance2, response = self.create_plugininstance_orm(
            self.token1,
            title='My Other Instance',
            plugin=self.plugin1.pk
        )

    def test_plugin_can_read_and_write_plugin_instance_data(self):
        # load plugin details with default auth
        response = self.rest_get_plugininstance(self.token1, self.plugin_instance1.pk)
        json_response = self.parse_response(response, expected_status_code=status.HTTP_200_OK)

        # simulate plugin: parse data from auth url
        auth_url = json_response.get('auth_url')
        query_string = urlparse(auth_url).query
        query_dict = parse_qs(query_string)
        jwt_token = query_dict.get('jwt')[0]
        api_base_url = query_dict.get('apiBaseUrl')[0]
        pk = query_dict.get('pk')[0]

        # simulate plugin: query plugin details using JWT auth
        self.reset_client_credentials()
        response = self.client.get(f'{api_base_url}{pk}/?jwt={jwt_token}', **HTTP_INFO)
        json_response = self.parse_response(response, expected_status_code=status.HTTP_200_OK)
        self.assertEqual(json_response.get('title'), self.plugin_instance1.title)
        plugin_instance_pk = json_response.get('pk')

        # simulate plugin: patch plugin rawdata and picture
        response = self.rest_update_plugininstance_with_jwt_auth(
            jwt_token, plugin_instance_pk,
            picture_file_name='demo2.png',
            rawdata_file_name='demo2.json',
            title='UPDATED TITLE'
        )
        json_response = self.parse_response(response, expected_status_code=status.HTTP_200_OK)
        self.assertEqual(json_response.get('title'), 'UPDATED TITLE')

        rawdata_jwt_url = json_response.get('download_rawdata')
        picture_jwt_url = json_response.get('download_picture')

        # simulate plugin: query rawdata with given download_rawdata URL
        response = self.client.get(rawdata_jwt_url, HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR)
        self.assert_response_status(response, status.HTTP_200_OK)
        self.assertIsInstance(response, FileResponse)
        rawdata_from_file = self._read_demo_file_as_bytes('demo2.json')
        rawdata_from_response = b''.join(response.streaming_content)
        self.assertEqual(rawdata_from_response, rawdata_from_file)

        # simulate plugin: query picture with given download_picture URL
        response = self.client.get(picture_jwt_url, HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR)
        self.assert_response_status(response, status.HTTP_200_OK)
        self.assertIsInstance(response, FileResponse)
        picture_from_file = self._read_demo_file_as_bytes('demo2.png')
        picture_from_response = b''.join(response.streaming_content)
        self.assertEqual(picture_from_response, picture_from_file)

    def test_invalid_jwt_token(self):
        auth_url, jwt_token, api_base_url, pk = self.simulate_plugin_init(self.token1, self.plugin_instance1.pk)
        self.reset_client_credentials()

        # try to access plugin instance details with invalid token
        invalid_token = jwt_token[:-3] + 'xxx'
        response = self.client.get(f'{api_base_url}{pk}/?jwt={invalid_token}', **HTTP_INFO)
        self.assert_response_status(response, status.HTTP_401_UNAUTHORIZED)

    def test_jwt_path_limitation(self):
        auth_url, jwt_token, api_base_url, pk = self.simulate_plugin_init(self.token1, self.plugin_instance1.pk)
        self.reset_client_credentials()

        # try to access details of a different plugin instance
        wrong_pk = self.plugin_instance2.pk
        response = self.client.get(f'{api_base_url}{wrong_pk}/?jwt={jwt_token}', **HTTP_INFO)
        self.assert_response_status(response, status.HTTP_401_UNAUTHORIZED)

    def test_expired_jwt_token(self):
        auth_url, jwt_token, api_base_url, pk = self.simulate_plugin_init(self.token1, self.plugin_instance1.pk)
        self.reset_client_credentials()

        token_validity_in_hours = settings.PLUGINS_SETTINGS['plugin_api_token_validity_in_hours']
        after_expiration = datetime.now() + timedelta(hours=token_validity_in_hours) + timedelta(hours=1)

        # travel in time beyond the expiration date
        with time_machine.travel(after_expiration, tick=False):
            # try to access the plugin instance
            response = self.client.get(f'{api_base_url}{pk}/?jwt={jwt_token}', **HTTP_INFO)
            self.assert_response_status(response, status.HTTP_401_UNAUTHORIZED)

    def test_invalidated_verification_token(self):
        auth_url, jwt_token, api_base_url, pk = self.simulate_plugin_init(self.token1, self.plugin_instance1.pk)
        self.reset_client_credentials()

        # invalidate verification token
        self.user1.userprofile.jwt_verification_token = generate_random_jwt_verification_token()
        self.user1.userprofile.save()

        # try to access plugin instance
        response = self.client.get(f'{api_base_url}{pk}/?jwt={jwt_token}', **HTTP_INFO)
        self.assert_response_status(response, status.HTTP_401_UNAUTHORIZED)

    def simulate_plugin_init(self, auth_token, plugin_instance_pk):
        # load plugin details with default auth
        response = self.rest_get_plugininstance(auth_token, plugin_instance_pk)
        json_response = self.parse_response(response, expected_status_code=status.HTTP_200_OK)

        # parse data from auth url
        auth_url = json_response.get('auth_url')
        query_string = urlparse(auth_url).query
        query_dict = parse_qs(query_string)
        jwt_token = query_dict.get('jwt')[0]
        api_base_url = query_dict.get('apiBaseUrl')[0]
        pk = query_dict.get('pk')[0]

        return auth_url, jwt_token, api_base_url, pk
