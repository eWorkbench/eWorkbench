#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.contrib.auth.models import Permission, User

from rest_framework import status
from rest_framework.test import APITestCase

from tests.test.helpers import HelperMixin

from eric.core.tests import HTTP_INFO
from eric.projects.tests.core import AuthenticationMixin
from eric.shared_elements.models import Task
from eric.shared_elements.tests.core import TaskMixin


class DeletePreventionTest(APITestCase, AuthenticationMixin, HelperMixin, TaskMixin):
    """
    Tests that workbench models can be deleted by superusers only
    """

    def setUp(self):
        # create superuser
        self.superuser = User.objects.create_user(
            username="root", email="root@email.com", password="password", is_superuser=True
        )
        self.superuser_token = self.login_and_return_token("root", "password", **HTTP_INFO)

        # create normal user
        self.user1 = User.objects.create_user(
            username="user1", email="user1@email.com", password="password", is_superuser=False
        )
        self.user1_token = self.login_and_return_token("user1", "password", **HTTP_INFO)

        # give all permissions to user1
        all_permissions = Permission.objects.all()
        self.user1.user_permissions.set(all_permissions)

        # create a task as user1
        self.task, response = self.create_task_orm(
            self.user1_token,
            None,
            "My task",
            "Description",
            Task.TASK_STATE_NEW,
            Task.TASK_PRIORITY_NORMAL,
            start_date=None,
            due_date=None,
            assigned_user=[],
            **HTTP_INFO,
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.content.decode())

    def test_model_can_not_be_deleted_by_normal_user(self):
        # trash task
        response = self.rest_trash_task(self.user1_token, self.task.pk, **HTTP_INFO)
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.content.decode())

        # delete task => must fail
        response = self.rest_delete_task(self.user1_token, self.task.pk, **HTTP_INFO)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN, response.content.decode())
        self.assertEqual(Task.objects.all().count(), 1)

    def test_model_can_be_deleted_by_superuser(self):
        # trash task from user1
        response = self.rest_trash_task(self.superuser_token, self.task.pk, **HTTP_INFO)
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.content.decode())

        # delete task from user1
        response = self.rest_delete_task(self.superuser_token, self.task.pk, **HTTP_INFO)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT, response.content.decode())
        self.assertEqual(Task.objects.all().count(), 0)
