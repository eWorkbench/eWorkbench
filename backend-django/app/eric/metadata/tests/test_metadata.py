#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import unittest
from datetime import datetime

from rest_framework.test import APITestCase
from rest_framework.utils import json

from eric.metadata.models.models import MetadataField
from eric.metadata.tests import HTTP_USER_AGENT, REMOTE_ADDRESS, http_info
from eric.metadata.tests.rest_mixin import MetadataRestRequestBuilder
from eric.projects.models import Project
from eric.projects.tests.core import AuthenticationMixin, ProjectsMixin, ModelPrivilegeMixin
from eric.shared_elements.models import Task
from eric.shared_elements.tests.core import TaskMixin
from eric.versions.tests.helper_mixin import HelperMixin


def api_data(field, values):
    return {
        'field': field.pk if field is not None else None,
        'values': values
    }


@unittest.skip("Metadata sub-endpoint is disabled for now")
class MetadataAPITest(APITestCase, AuthenticationMixin, ModelPrivilegeMixin, HelperMixin,
                      ProjectsMixin, TaskMixin):
    """ Tests the metadata API """

    def setUp(self):
        self.superuser, self.token = self.create_user_and_login("superuser", is_superuser=True)

        # set up some base types
        self.fraction_field = MetadataField.objects.create(
            name='MyFraction', description="...",
            base_type=MetadataField.BASE_TYPE_FRACTION, type_settings={},
        )
        self.decimal_field = MetadataField.objects.create(
            name='MyDecimal', description="...",
            base_type=MetadataField.BASE_TYPE_DECIMAL_NUMBER, type_settings={},
        )

        self.project = self.create_project(
            self.token, "MyProject", "My test project", Project.INITIALIZED, **http_info
        )

        self.task, response = self.create_task_orm(
            self.token, self.project.pk, "My task", "My task description",
            Task.TASK_STATE_PROGRESS, Task.TASK_PRIORITY_NORMAL, datetime.now(), datetime.now(), [],
            HTTP_USER_AGENT, REMOTE_ADDRESS,
        )

        self.request_builder = MetadataRestRequestBuilder(self).for_endpoint('tasks').as_user(self.token)

    def test_post_and_get_list(self):
        # post a metadata value
        self.request_builder.post(
            self.task.pk,
            api_data(self.fraction_field, {'numerator': 7, 'denominator': 123})
        )

        # load it via API and check it's contents
        response = self.request_builder.get_list(self.task.pk)
        json_response = json.loads(response.content.decode())
        self.assertEqual(len(json_response), 1)
        self.assertEqual(json_response[0]['entity_id'], str(self.task.pk))
        self.assertEqual(json_response[0]['field'], str(self.fraction_field.pk))
        self.assertEqual(json_response[0]['values'], {'numerator': 7, 'denominator': 123})

        # post more metadata values
        self.request_builder.post(
            self.task.pk,
            api_data(self.decimal_field, {'value': 987654321.012356879})
        )
        self.request_builder.post(
            self.task.pk,
            api_data(self.decimal_field, {'value': 3.14})
        )

        # check that the API provides all of them
        response = self.request_builder.get_list(self.task.pk)
        json_response = json.loads(response.content.decode())
        self.assertEqual(len(json_response), 3)

    def test_patch(self):
        # post a metadata value
        response = self.request_builder.post(
            self.task.pk,
            api_data(self.decimal_field, {'value': 1.2})
        )
        pk = json.loads(response.content.decode())['pk']

        # patch it
        self.request_builder.patch(
            model_pk=self.task.pk,
            metadata_pk=pk,
            data=api_data(field=self.fraction_field, values={'numerator': 1, 'denominator': 100})
        )

        # check that the API provides the patched values
        response = self.request_builder.get_list(self.task.pk)
        json_response = json.loads(response.content.decode())
        self.assertEqual(len(json_response), 1)
        self.assertEqual(json_response[0]['field'], str(self.fraction_field.pk))
        self.assertEqual(json_response[0]['values'], {'numerator': 1, 'denominator': 100})

    def test_delete(self):
        # post a metadata value
        response = self.request_builder.post(
            self.task.pk,
            api_data(self.decimal_field, {'value': 1.2})
        )
        pk = json.loads(response.content.decode())['pk']

        # delete it
        self.request_builder.delete(
            model_pk=self.task.pk,
            metadata_pk=pk,
        )

        # check that there is no metadata
        response = self.request_builder.get_list(self.task.pk)
        json_response = json.loads(response.content.decode())
        self.assertEqual(len(json_response), 0)
