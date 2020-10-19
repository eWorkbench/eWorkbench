#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import json
import os

from rest_framework import status

from eric.core.tests import HTTP_USER_AGENT, REMOTE_ADDR
from eric.core.tests.test_utils import CommonTestMixin, params_dict_to_url_params
from eric.plugins.models import PluginInstance
from eric.projects.tests.core import TestLockMixin

DEMO_FILE_DIRECTORY = "demo_plugininstances"
PLUGIN_INSTANCE_BASE_URL = '/api/plugininstances/'
PLUGIN_BASE_URL = '/api/plugins/'


class PluginInstanceMixin(CommonTestMixin, TestLockMixin):
    """
    Mixin which provides several wrapper methods for the /api/plugininstances/ endpoint
    """

    def rest_get_plugininstance_export_link(self, auth_token: str, pk: str,
                                            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR):
        """
        Wrapper for getting the export link of a plugin instance
        """
        self.set_auth_token(auth_token)

        return self.client.get(
            PLUGIN_INSTANCE_BASE_URL + '{}/get_export_link/'.format(pk),
            HTTP_USER_AGENT=HTTP_USER_AGENT,
            REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_search_plugininstances(self, auth_token: str, search_string: str,
                                    HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR):
        """
        Wrapper for searching the plugin instance endpoint
        """
        self.set_auth_token(auth_token)

        return self.client.get(
            PLUGIN_INSTANCE_BASE_URL + '?search={}'.format(search_string),
            HTTP_USER_AGENT=HTTP_USER_AGENT,
            REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_get_plugininstances_recently_modified_by_me(self, auth_token: str, number_of_days: int,
                                                         HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR):
        """
        Wrapper for showing only recently modified elements of the plugin instance endpoint
        """
        self.set_auth_token(auth_token)

        return self.client.get(
            PLUGIN_INSTANCE_BASE_URL + '?recently_modified_by_me={}'.format(number_of_days),
            HTTP_USER_AGENT=HTTP_USER_AGENT,
            REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_get_plugininstance(self, auth_token, pk: str,
                                HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR):
        """
        Wrapper for getting a plugininstance by its pk via REST API
        """
        self.set_auth_token(auth_token)

        return self.client.get(
            PLUGIN_INSTANCE_BASE_URL + '{}/'.format(pk),
            HTTP_USER_AGENT=HTTP_USER_AGENT,
            REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_get_plugininstances(self, auth_token: str,
                                 HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR):
        """
        Wrapper for getting a list of plugin instances that the current user has access to via REST API
        """
        self.set_auth_token(auth_token)

        return self.client.get(
            PLUGIN_INSTANCE_BASE_URL,
            {},
            HTTP_USER_AGENT=HTTP_USER_AGENT,
            REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_get_plugininstances_for_project(self, auth_token: str, project_pk: str,
                                             HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR):
        """ Wrapper for getting a list of plugin instances for a specific project via REST API (using filter
        ?project={project_pk}) """
        self.set_auth_token(auth_token)

        return self.client.get(
            PLUGIN_INSTANCE_BASE_URL,
            {
                'project': project_pk
            },
            HTTP_USER_AGENT=HTTP_USER_AGENT,
            REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_delete_plugininstance(self, auth_token: str, pk: str,
                                   HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR):
        """ Wrapper for deleting a plugin instance via REST API """
        self.set_auth_token(auth_token)

        return self.client.delete(
            PLUGIN_INSTANCE_BASE_URL + '{pk}/'.format(pk=pk),
            HTTP_USER_AGENT=HTTP_USER_AGENT,
            REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_restore_plugininstance(self, auth_token: str, pk: str,
                                    HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR):
        """ Wrapper for restoring a plugin instance via REST API """
        self.set_auth_token(auth_token)

        return self.client.patch(
            PLUGIN_INSTANCE_BASE_URL + '{pk}/restore/'.format(pk=pk),
            HTTP_USER_AGENT=HTTP_USER_AGENT,
            REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_trash_plugininstance(self, auth_token: str, pk: str,
                                  HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR):
        """ Wrapper for trashing a plugin instance via REST API """
        self.set_auth_token(auth_token)

        return self.client.patch(
            PLUGIN_INSTANCE_BASE_URL + '{pk}/soft_delete/'.format(pk=pk),
            HTTP_USER_AGENT=HTTP_USER_AGENT,
            REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_update_plugininstance(
            self,
            auth_token: str,
            pk: str,
            picture_file_name: str = None,
            rawdata_file_name: str = None,
            HTTP_USER_AGENT=HTTP_USER_AGENT,
            REMOTE_ADDR=REMOTE_ADDR,
            **kwargs
    ):
        """ Wrapper for updating a plugin instance via REST API """

        self.set_auth_token(auth_token)

        return self.__rest_update_plugininstance(
            pk, picture_file_name, rawdata_file_name,
            HTTP_USER_AGENT, REMOTE_ADDR,
            **kwargs
        )

    def rest_update_plugininstance_with_jwt_auth(
            self,
            jwt_token: str,
            pk: str,
            picture_file_name: str = None,
            rawdata_file_name: str = None,
            HTTP_USER_AGENT=HTTP_USER_AGENT,
            REMOTE_ADDR=REMOTE_ADDR,
            **kwargs
    ):
        """ Wrapper for updating a plugin instance via REST API using JWT auth """

        self.set_jwt_token(jwt_token)

        return self.__rest_update_plugininstance(
            pk, picture_file_name, rawdata_file_name,
            HTTP_USER_AGENT, REMOTE_ADDR,
            **kwargs
        )

    def __rest_update_plugininstance(
            self,
            pk: str,
            picture_file_name: str = None,
            rawdata_file_name: str = None,
            HTTP_USER_AGENT=HTTP_USER_AGENT,
            REMOTE_ADDR=REMOTE_ADDR,
            **kwargs
    ):
        data = dict(kwargs)

        picture = None
        if picture_file_name:
            data['picture'] = picture = self._read_demo_file(picture_file_name)

        rawdata = None
        if rawdata_file_name:
            data['rawdata'] = rawdata = self._read_demo_file(rawdata_file_name)

        response = self.client.patch(
            f'{PLUGIN_INSTANCE_BASE_URL}{pk}/',
            data,
            format='multipart',  # needs to be multi part for file uploads
            HTTP_USER_AGENT=HTTP_USER_AGENT,
            REMOTE_ADDR=REMOTE_ADDR
        )

        if picture:
            picture.close()

        if rawdata:
            rawdata.close()

        return response

    def rest_update_plugininstance_project(self, auth_token, pk, project_pks,
                                           HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR):
        return self.rest_update_plugininstance(
            auth_token, pk, HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR,
            projects=project_pks
        )

    def rest_get_plugin_instance_rawdata(self, auth_token, pk):
        self.set_auth_token(auth_token)
        return self.client.get(
            f'{PLUGIN_INSTANCE_BASE_URL}{pk}/rawdata/',
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_get_plugin_instance_picture(self, auth_token, pk):
        self.set_auth_token(auth_token)
        return self.client.get(
            f'{PLUGIN_INSTANCE_BASE_URL}{pk}/picture.png/',
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_create_plugininstance(self, auth_token: str,
                                   picture_file_name: str = None,
                                   rawdata_file_name: str = None,
                                   HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR,
                                   **kwargs):
        """ Wrapper for creating a plugininstance via REST API and uploading a background image """
        self.set_auth_token(auth_token)

        data = dict(kwargs)

        picture = None
        if picture_file_name:
            data['picture'] = picture = self._read_demo_file(picture_file_name)

        rawdata = None
        if rawdata_file_name:
            data['rawdata'] = rawdata = self._read_demo_file(rawdata_file_name)

        response = self.client.post(
            PLUGIN_INSTANCE_BASE_URL,
            data,
            format='multipart',  # needs to be multi part for file uploads
            HTTP_USER_AGENT=HTTP_USER_AGENT,
            REMOTE_ADDR=REMOTE_ADDR
        )

        if picture:
            picture.close()

        if rawdata:
            rawdata.close()

        return response

    def create_plugininstance_orm(self, auth_token: str,
                                  picture_file_name: str = None,
                                  rawdata_file_name: str = None,
                                  **kwargs):
        """ Wrapper for rest_create_plugininstance which also returns a PluginInstance Object from Djangos ORM """

        response = self.rest_create_plugininstance(
            auth_token,
            picture_file_name=picture_file_name,
            rawdata_file_name=rawdata_file_name,
            **kwargs
        )

        if response.status_code == status.HTTP_201_CREATED:
            decoded = json.loads(response.content.decode())
            return PluginInstance.objects.get(pk=decoded['pk']), response
        else:
            return None, response

    @staticmethod
    def _get_demo_file_path(file_name):
        return os.path.join(
            os.path.dirname(__file__), DEMO_FILE_DIRECTORY, file_name
        )

    @classmethod
    def _read_demo_file(cls, file_name):
        if file_name:
            path = cls._get_demo_file_path(file_name)
            return open(path, 'rb')
        else:
            return None

    @classmethod
    def _read_demo_file_as_bytes(cls, file_name):
        with cls._read_demo_file(file_name) as file_handle:
            return file_handle.read()


class PluginMixin(CommonTestMixin):
    """
    Mixin which provides several wrapper methods for the /api/plugins/ endpoint
    """

    def rest_send_plugin_feedback(self, auth_token, plugin_pk, subject, message):
        # currently rest_send_plugin_generic_feedback is used instead of this method
        self.set_auth_token(auth_token)

        data = {
            'subject': subject,
            'message': message,
        }

        return self.client.post(
            '{base_url}{pk}/send_feedback/'.format(base_url=PLUGIN_BASE_URL, pk=plugin_pk),
            data,
            format='json',
            HTTP_USER_AGENT=HTTP_USER_AGENT,
            REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_request_plugin_access(self, auth_token, plugin_pk, message):
        # currently rest_send_plugin_generic_feedback is used instead of this method
        self.set_auth_token(auth_token)

        data = {
            'message': message,
        }

        return self.client.post(
            '{base_url}{pk}/request_access/'.format(base_url=PLUGIN_BASE_URL, pk=plugin_pk),
            data,
            format='json',
            HTTP_USER_AGENT=HTTP_USER_AGENT,
            REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_send_plugin_generic_feedback(self, auth_token, plugin_pk, subject, message, feedback_type):
        self.set_auth_token(auth_token)

        data = {
            'subject': subject,
            'message': message,
            'pluginPk': plugin_pk,
            'type': feedback_type
        }
        return self.client.post(
            '{base_url}feedback/'.format(base_url=PLUGIN_BASE_URL),
            data,
            format='json',
            HTTP_USER_AGENT=HTTP_USER_AGENT,
            REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_search_plugin(self, auth_token: str, search_string: str,
                           HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR):
        self.set_auth_token(auth_token)

        return self.client.get(
            PLUGIN_BASE_URL + '?search={}'.format(search_string),
            HTTP_USER_AGENT=HTTP_USER_AGENT,
            REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_get_plugin_recently_modified_by_me(self, auth_token: str, number_of_days: int,
                                                HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR):
        self.set_auth_token(auth_token)

        return self.client.get(
            PLUGIN_BASE_URL + '?recently_modified_by_me={}'.format(number_of_days),
            HTTP_USER_AGENT=HTTP_USER_AGENT,
            REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_get_plugin(self, auth_token, pk: str,
                        HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR):
        self.set_auth_token(auth_token)

        return self.client.get(
            PLUGIN_BASE_URL + '{}/'.format(pk),
            HTTP_USER_AGENT=HTTP_USER_AGENT,
            REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_get_plugin_list(self, auth_token: str, params=None,
                             HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR):
        self.set_auth_token(auth_token)

        url = PLUGIN_BASE_URL
        if params:
            url += params_dict_to_url_params(params)

        return self.client.get(
            url,
            HTTP_USER_AGENT=HTTP_USER_AGENT,
            REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_get_plugins_for_project(self, auth_token: str, project_pk: str,
                                     HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR):
        self.set_auth_token(auth_token)

        return self.client.get(
            PLUGIN_BASE_URL,
            {
                'project': project_pk
            },
            HTTP_USER_AGENT=HTTP_USER_AGENT,
            REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_delete_plugin(self, auth_token: str, pk: str,
                           HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR):
        self.set_auth_token(auth_token)

        return self.client.delete(
            PLUGIN_BASE_URL + '{pk}/'.format(pk=pk),
            HTTP_USER_AGENT=HTTP_USER_AGENT,
            REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_update_plugin(self, auth_token: str, pk: str,
                           HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR,
                           **kwargs):
        self.set_auth_token(auth_token)

        data = dict(kwargs)

        response = self.client.put(
            PLUGIN_BASE_URL + '{}/'.format(pk),
            data,
            format='multipart',  # needs to be multipart for file uploads
            HTTP_USER_AGENT=HTTP_USER_AGENT,
            REMOTE_ADDR=REMOTE_ADDR
        )

        return response

    def rest_create_plugin(self, auth_token: str,
                           HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR,
                           **kwargs):
        self.set_auth_token(auth_token)

        data = dict(kwargs)

        response = self.client.post(
            PLUGIN_BASE_URL,
            data,
            format='multipart',  # needs to be multipart for file uploads
            HTTP_USER_AGENT=HTTP_USER_AGENT,
            REMOTE_ADDR=REMOTE_ADDR
        )

        return response
