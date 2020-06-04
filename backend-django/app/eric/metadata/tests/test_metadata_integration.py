#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import json
from datetime import datetime

from rest_framework.status import HTTP_201_CREATED, HTTP_200_OK
from rest_framework.test import APITestCase

from eric.core.tests import custom_json_handler
from eric.metadata.models.models import MetadataField
from eric.metadata.tests import HTTP_USER_AGENT, REMOTE_ADDRESS, http_info
from eric.projects.models import Project
from eric.projects.tests.core import AuthenticationMixin, ProjectsMixin, ModelPrivilegeMixin
from eric.shared_elements.models import Task
from eric.shared_elements.tests.core import TaskMixin
from eric.versions.tests.helper_mixin import HelperMixin


class MetadataIntegrationTest(APITestCase, AuthenticationMixin, ModelPrivilegeMixin, HelperMixin, ProjectsMixin,
                              TaskMixin):

    def setUp(self):
        superuser, token = self.create_user_and_login("superuser", is_superuser=True)
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + token)

        # set up some base types
        self.decimal_field = MetadataField.objects.create(
            name='MyDecimal', description="...",
            base_type=MetadataField.BASE_TYPE_DECIMAL_NUMBER, type_settings={},
        )

        self.project = self.create_project(
            token, "MyProject", "My test project", Project.INITIALIZED, **http_info
        )

        self.task, response = self.create_task_orm(
            token, self.project.pk, "My task", "My task description",
            Task.TASK_STATE_PROGRESS, Task.TASK_PRIORITY_NORMAL, datetime.now(), datetime.now(), [],
            HTTP_USER_AGENT, REMOTE_ADDRESS,
        )
        self.assertEqual(response.status_code, HTTP_201_CREATED, response.content.decode())

    def test_task_create(self):
        """ Tests posting a new task with metadata """

        data = {
            "title": 'MyTask',
            "state": Task.TASK_STATE_NEW,
            "priority": Task.TASK_PRIORITY_NORMAL,
            "metadata": [
                {'field': self.decimal_field.pk, 'values': {'value': 1.0}},
                {'field': self.decimal_field.pk, 'values': {'value': 2.0}},
            ]
        }

        response = self.client.post(
            path='/api/tasks/',
            data=json.dumps(data, default=custom_json_handler),
            content_type='application/json',
            **http_info
        )

        self.assertEqual(response.status_code, HTTP_201_CREATED, response.content.decode())

    def test_task_update_mixed(self):
        """ Tests patching an existing task's metadata """

        # patch initial metadata
        data1 = {
            "metadata": [
                {'field': self.decimal_field.pk, 'values': {'value': 1.0}},
                {'field': self.decimal_field.pk, 'values': {'value': 2.0}},
                {'field': self.decimal_field.pk, 'values': {'value': 3.0}},
            ]
        }

        response_metadata1 = self.__send_patch_request(data1)
        self.assertEqual(len(response_metadata1), 3)

        # get pks for the saved metadata
        value_to_pk_map = {}
        for metadata in response_metadata1:
            value_as_key = metadata['values']['value']
            value_to_pk_map[value_as_key] = metadata['pk']

        # modify, remove and add metadata
        data2 = {
            "metadata": [
                # 1.0 left the same
                {'field': self.decimal_field.pk, 'values': {'value': 1.0}, 'pk': value_to_pk_map[1.0]},
                # 2.0 modified
                {'field': self.decimal_field.pk, 'values': {'value': 2.5}, 'pk': value_to_pk_map[2.0]},
                # 3.0 removed
                # 4.0 added
                {'field': self.decimal_field.pk, 'values': {'value': 4.0}},
            ]
        }

        response_metadata2 = self.__send_patch_request(data2)
        self.assertEqual(len(response_metadata2), 3)

        # check 1.0 is the same
        value = next(
            metadata['values']['value'] for metadata in response_metadata2
            if metadata['pk'] == value_to_pk_map[1.0]
        )
        self.assertEqual(value, 1.0)

        # check 2.0 is modified
        value = next(
            metadata['values']['value'] for metadata in response_metadata2
            if metadata['pk'] == value_to_pk_map[2.0]
        )
        self.assertEqual(value, 2.5)

        # check 3.0 is deleted
        values = [metadata['values']['value'] for metadata in response_metadata2]
        self.assertNotIn(3.0, values)

        # check 4.0 is added
        self.assertIn(4.0, values)

    def test_task_update_single_changes(self):
        """ Tests patching an existing task's metadata """

        # patch initial metadata
        data1 = {
            "metadata": [
                {'field': self.decimal_field.pk, 'values': {'value': 1.0}},
                {'field': self.decimal_field.pk, 'values': {'value': 2.0}},
                {'field': self.decimal_field.pk, 'values': {'value': 3.0}},
            ]
        }

        response_metadata1 = self.__send_patch_request(data1)
        self.assertEqual(len(response_metadata1), 3)

        # delete some metadata
        data2 = {
            "metadata": response_metadata1
        }
        removed_metadata = data2['metadata'][0]
        del data2['metadata'][0]

        response_metadata2 = self.__send_patch_request(data2)
        self.assertEqual(len(response_metadata2), 2)
        self.assertFalse(removed_metadata['pk'] in [metadata['pk'] for metadata in response_metadata2])

        # add more data
        data3 = {
            "metadata": response_metadata2
        }
        data3['metadata'].append({'field': self.decimal_field.pk, 'values': {'value': 4.0}})

        response_metadata3 = self.__send_patch_request(data3)
        self.assertEqual(len(response_metadata3), 3)

        # change some data
        data4 = {
            "metadata": response_metadata3
        }
        modified_metadata = data4['metadata'][0]
        new_value = 123.321
        modified_metadata['values']['value'] = new_value

        response_metadata4 = self.__send_patch_request(data4)
        self.assertEqual(len(response_metadata4), 3)
        for metadata in response_metadata4:
            if metadata['pk'] == modified_metadata['pk']:
                self.assertEquals(metadata['values']['value'], new_value)

    def test_task_delete_metadata_by_patching_empty(self):
        # add initial metadata
        data_initial = {
            "metadata": [
                {'field': self.decimal_field.pk, 'values': {'value': 1.0}},
                {'field': self.decimal_field.pk, 'values': {'value': 2.0}},
            ]
        }
        response_initial = self.__send_patch_request(data_initial)
        self.assertEqual(len(response_initial), 2)

        # delete first metadata by patch
        data_patch1 = {
            "metadata": [
                {'field': self.decimal_field.pk, 'values': {'value': 2.0}},
            ]
        }
        response_patch1 = self.__send_patch_request(data_patch1)

        # check there is only the second metadata left in the response
        self.assertEqual(len(response_patch1), 1)
        self.assertEqual(response_patch1[0]['values']['value'], 2.0)

        # check there is only the second metadata left in the database
        metadata = self.__get_metadata_of_task()
        self.assertEqual(len(metadata), 1)
        self.assertEqual(response_patch1[0]['values']['value'], 2.0)

        # delete last metadata by patching empty array
        data_patch2 = {
            "metadata": []
        }
        response_patch2 = self.__send_patch_request(data_patch2)

        # check there is no more metadata in the response
        self.assertEqual(len(response_patch2), 0)

        # check there is no more metadata in the database
        metadata = self.__get_metadata_of_task()
        self.assertEqual(len(metadata), 0)

    def __check_response_and_get_metadata(self, response, status_code=HTTP_200_OK):
        self.assertEqual(response.status_code, status_code, response.content.decode())
        json_response = json.loads(response.content.decode())
        return json_response['metadata']

    def __get_metadata_of_task(self):
        response = self.client.get(
            path='/api/tasks/{pk}/'.format(pk=self.task.pk),
            **http_info
        )
        return self.__check_response_and_get_metadata(response)

    def __send_patch_request(self, data):
        response = self.client.patch(
            path='/api/tasks/{pk}/'.format(pk=self.task.pk),
            data=json.dumps(data, default=custom_json_handler),
            content_type='application/json',
            **http_info
        )
        return self.__check_response_and_get_metadata(response)
