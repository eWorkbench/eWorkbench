#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import json

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group, Permission
from django.utils.timezone import datetime, timedelta
from django.utils.translation import gettext as _

from rest_framework import status
from rest_framework.test import APITestCase

from eric.core.tests import HTTP_USER_AGENT, REMOTE_ADDR, test_utils
from eric.projects.models import Project, Role
from eric.projects.tests.core import AuthenticationMixin, ProjectsMixin, UserMixin
from eric.shared_elements.models import Task
from eric.shared_elements.tests.core import TaskMixin

User = get_user_model()


class TasksTest(APITestCase, AuthenticationMixin, UserMixin, TaskMixin, ProjectsMixin):
    """
    Tests the /api/tasks endpoint
    Tests for creating, retrieving and updateing Tasks
    Tests for Tasks that are project-related and not project-related (permissions)
    """

    def setUp(self):
        """Set up a couple of users and roles and projects"""
        self.student_role = self.create_student_role()

        self.pm_role = Role.objects.filter(default_role_on_project_create=True).first()

        self.user_group = Group.objects.get(name="User")

        # get add_task and add_task_without_project permission
        self.add_task_permission = Permission.objects.filter(
            codename="add_task", content_type=Task.get_content_type()
        ).first()

        self.add_task_without_project_permission = Permission.objects.filter(
            codename="add_task_without_project", content_type=Task.get_content_type()
        ).first()

        self.user1 = User.objects.create_user(username="student_1", email="student_1@email.com", password="top_secret")
        self.token1 = self.login_and_return_token("student_1", "top_secret")
        self.user1.groups.add(self.user_group)

        self.user2 = User.objects.create_user(username="student_2", email="student_2@email.com", password="foobar")
        self.token2 = self.login_and_return_token("student_2", "foobar")
        self.user2.groups.add(self.user_group)

        # create a user without any special permissions
        self.user3 = User.objects.create_user(username="student_3", email="student_3@email.com", password="permission")
        self.token3 = self.login_and_return_token("student_3", "permission")

        # create two projects
        self.project1 = self.create_project(
            self.token1,
            "My Own Project (user1)",
            "Only user1 has access to this project",
            Project.STARTED,
            HTTP_USER_AGENT,
            REMOTE_ADDR,
        )

        self.project2 = self.create_project(
            self.token2,
            "Another Project (user2)",
            "Only user2 has access to this project",
            Project.STARTED,
            HTTP_USER_AGENT,
            REMOTE_ADDR,
        )

        # add user3 to project1
        self.rest_assign_user_to_project(
            self.token1,
            self.project1,
            self.user3,
            self.pm_role,
            HTTP_USER_AGENT=HTTP_USER_AGENT,
            REMOTE_ADDR=REMOTE_ADDR,
        )

    def test_create_task_with_and_without_permission(self):
        """
        Tests creating a task with and without the appropriate permission
        :return:
        """
        # there should be zero Tasks to begin with
        self.assertEqual(Task.objects.all().count(), 0, msg="There should be zero Tasks to begin with")

        # try creating a task without a project and without having the proper permission
        response = self.rest_create_task(
            self.token3,
            None,
            "Test Task",
            "Test Description",
            Task.TASK_STATE_NEW,
            Task.TASK_PRIORITY_HIGH,
            datetime.now(),
            datetime.now() + timedelta(days=30),
            self.user3.pk,
            HTTP_USER_AGENT,
            REMOTE_ADDR,
        )
        self.assertIn(response.status_code, [status.HTTP_403_FORBIDDEN, status.HTTP_400_BAD_REQUEST])

        # there should still be zero Tasks
        self.assertEqual(Task.objects.all().count(), 0, msg="There should still be zero Tasks")

        # however, creating a task for a project1 should work, as user1 has created project1 (and therefore should have
        # the needed permissions)
        response = self.rest_create_task(
            self.token3,
            self.project1.pk,
            "Test Task",
            "Test Description",
            Task.TASK_STATE_NEW,
            Task.TASK_PRIORITY_HIGH,
            datetime.now(),
            datetime.now() + timedelta(days=30),
            self.user3.pk,
            HTTP_USER_AGENT,
            REMOTE_ADDR,
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # now give the user the global add_task permission
        self.user3.user_permissions.add(self.add_task_without_project_permission)

        # try creating a task without a project now, and it should work
        response = self.rest_create_task(
            self.token3,
            None,
            "Test Task",
            "Test Description",
            Task.TASK_STATE_NEW,
            Task.TASK_PRIORITY_HIGH,
            datetime.now(),
            datetime.now() + timedelta(days=30),
            self.user3.pk,
            HTTP_USER_AGENT,
            REMOTE_ADDR,
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # there should now be two Tasks
        self.assertEqual(Task.objects.all().count(), 2, msg="There should be two Tasks in the database")

        # and those two should be viewable by the current user
        response = self.rest_get_tasks(self.token3, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # check the response
        decoded = json.loads(response.content.decode())
        decoded = test_utils.get_paginated_results(decoded)
        # should contain exactly no Tasks
        self.assertEqual(len(decoded), 2, msg="There should be two Tasks viewable by the user")

        # revoke add_task_permission of user
        self.user3.user_permissions.remove(self.add_task_permission)
        # and give the user the add_task_without_project permission
        self.user3.user_permissions.add(self.add_task_without_project_permission)

        # try creating a task without a project now, and it should work
        response = self.rest_create_task(
            self.token3,
            None,
            "Test Task",
            "Test Description",
            Task.TASK_STATE_NEW,
            Task.TASK_PRIORITY_HIGH,
            datetime.now(),
            datetime.now() + timedelta(days=30),
            self.user3.pk,
            HTTP_USER_AGENT,
            REMOTE_ADDR,
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # there should now be three Tasks
        self.assertEqual(Task.objects.all().count(), 3, msg="There should be three Tasks in the database")

        # and those two should be viewable by the current user
        response = self.rest_get_tasks(self.token3, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # check the response
        decoded = json.loads(response.content.decode())
        decoded = test_utils.get_paginated_results(decoded)
        # should contain exactly no Tasks
        self.assertEqual(len(decoded), 3, msg="There should be three Tasks viewable by the user")

    def test_get_tasks_with_filter(self):
        """
        Tests creating and retrieving Tasks that are not associated to a project
        :return:
        """

        # add permission for creating Tasks to the current user
        self.user1.user_permissions.add(self.add_task_without_project_permission)

        # there should be zero Tasks
        self.assertEqual(Task.objects.all().count(), 0, msg="There should be zero Tasks to begin with")

        # get all existing Tasks (there should be zero Tasks)
        response = self.rest_get_tasks(self.token1, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # check the response
        decoded = json.loads(response.content.decode())
        decoded = test_utils.get_paginated_results(decoded)
        # should contain exactly no Tasks
        self.assertEqual(len(decoded), 0, msg="/Tasks/ endpoint should return zero Tasks")

        # try to query the same endpoint with a project_pk (should still be zero Tasks)
        response = self.rest_get_tasks_for_project(self.token1, self.project1.pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # check the response
        decoded = json.loads(response.content.decode())
        decoded = test_utils.get_paginated_results(decoded)
        # should contain exactly no Tasks
        self.assertEqual(len(decoded), 0, msg="/Tasks/?project=1234-abcd endpoint should return zero Tasks")

        # create a task without depending on a project
        response = self.rest_create_task(
            self.token1,
            None,
            "Test Task",
            "Test Description",
            Task.TASK_STATE_NEW,
            Task.TASK_PRIORITY_HIGH,
            datetime.now(),
            datetime.now() + timedelta(days=30),
            self.user1.pk,
            HTTP_USER_AGENT,
            REMOTE_ADDR,
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # decode response
        decoded = json.loads(response.content.decode())
        # get task object from db
        task = Task.objects.get(pk=decoded["pk"])
        # verify that the task object was stored and returned properly
        self.assertEqual(decoded["pk"], str(task.pk))
        self.assertEqual(decoded["title"], "Test Task")
        self.assertEqual(task.title, "Test Task")

        ########
        # create a task for project1
        ########
        response = self.rest_create_task(
            self.token1,
            self.project1.pk,
            "Test Task",
            "Test Description",
            Task.TASK_STATE_NEW,
            Task.TASK_PRIORITY_HIGH,
            datetime.now(),
            datetime.now() + timedelta(days=30),
            self.user1.pk,
            HTTP_USER_AGENT,
            REMOTE_ADDR,
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # decode response
        decoded = json.loads(response.content.decode())
        # get task object from db
        task = Task.objects.get(pk=decoded["pk"])
        # verify that the task object was stored and returned properly
        self.assertEqual(decoded["pk"], str(task.pk))
        self.assertEqual(decoded["title"], "Test Task")
        self.assertEqual(task.title, "Test Task")

        # and there should be two Tasks "viewable" by the current user
        response = self.rest_get_tasks(self.token1, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # check the response
        decoded = json.loads(response.content.decode())
        decoded = test_utils.get_paginated_results(decoded)
        # should contain exactly no Tasks
        self.assertEqual(len(decoded), 2, msg="There should be two Tasks viewable by the user")

        # and also three Tasks returned from the endpoint
        response = self.rest_get_tasks(self.token1, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # check the response
        decoded = json.loads(response.content.decode())
        decoded = test_utils.get_paginated_results(decoded)
        # should contain exactly no Tasks
        self.assertEqual(len(decoded), 2, msg="/Tasks/ endpoint should return two Tasks")

    def test_user_can_only_see_tasks_created_by_own_user(self):
        """
        Tests whether the user can only see Tasks created by the own user, not by other users
        :return:
        """
        # add permission for creating Tasks to user1
        self.user1.user_permissions.add(self.add_task_without_project_permission)

        # add permission for creating Tasks to user2
        self.user2.user_permissions.add(self.add_task_without_project_permission)

        # there should be zero Tasks
        self.assertEqual(Task.objects.all().count(), 0, msg="There should be zero Tasks to begin with")

        # try creating a task without a project for user1 (token1)
        response = self.rest_create_task(
            self.token1,
            None,
            "Test Task",
            "Test Description",
            Task.TASK_STATE_NEW,
            Task.TASK_PRIORITY_HIGH,
            datetime.now(),
            datetime.now() + timedelta(days=30),
            self.user1.pk,
            HTTP_USER_AGENT,
            REMOTE_ADDR,
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # try creating a task without a project for user2 (token2)
        response = self.rest_create_task(
            self.token2,
            None,
            "Test Task",
            "Test Description",
            Task.TASK_STATE_NEW,
            Task.TASK_PRIORITY_HIGH,
            datetime.now(),
            datetime.now() + timedelta(days=30),
            self.user2.pk,
            HTTP_USER_AGENT,
            REMOTE_ADDR,
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # there should be two Tasks
        self.assertEqual(Task.objects.all().count(), 2, msg="There should be two Tasks")

        # try quering the rest endpoint for user1 - there should only be one task
        response = self.rest_get_tasks(self.token1, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # check the response
        decoded = json.loads(response.content.decode())
        decoded = test_utils.get_paginated_results(decoded)
        # should contain exactly no Tasks
        self.assertEqual(len(decoded), 1, msg="There should only be one task visible for user1")

        # try quering the rest endpoint for user2 - there should only be one task
        response = self.rest_get_tasks(self.token2, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # check the response
        decoded = json.loads(response.content.decode())
        decoded = test_utils.get_paginated_results(decoded)
        # should contain exactly no Tasks
        self.assertEqual(len(decoded), 1, msg="There should only be one task visible for user2")

    def test_create_and_get_tasks(self):
        """
        Tests creating a new task within a project
        """
        project = self.create_project(
            self.token1,
            "My Own Project",
            "Nobody else has access to this project",
            Project.STARTED,
            HTTP_USER_AGENT,
            REMOTE_ADDR,
        )

        # get all Tasks from rest api for this project
        response = self.rest_get_tasks_for_project(self.token1, project.pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # check the response
        decoded = json.loads(response.content.decode())
        decoded = test_utils.get_paginated_results(decoded)
        # should contain exactly no Tasks
        self.assertEqual(len(decoded), 0)

        # create a task
        task, response = self.create_task_orm(
            self.token1,
            project.pk,
            "Test Task",
            "Test Description",
            Task.TASK_STATE_NEW,
            Task.TASK_PRIORITY_HIGH,
            datetime.now(),
            datetime.now() + timedelta(days=30),
            self.user1.pk,
            HTTP_USER_AGENT,
            REMOTE_ADDR,
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        self.assertEqual(task.title, "Test Task")

        # get all Tasks from rest api for this project
        response = self.rest_get_tasks_for_project(self.token1, project.pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # check the response
        decoded = json.loads(response.content.decode())
        decoded = test_utils.get_paginated_results(decoded)

        # should contain exactly one Tasks
        self.assertEqual(len(decoded), 1)

        # create another task
        response = self.rest_create_task(
            self.token1,
            project.pk,
            "Another Test Task",
            "Another Test Description",
            Task.TASK_STATE_NEW,
            Task.TASK_PRIORITY_HIGH,
            datetime.now(),
            datetime.now() + timedelta(days=30),
            self.user1.pk,
            HTTP_USER_AGENT,
            REMOTE_ADDR,
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # get all Tasks from rest api for this project
        response = self.rest_get_tasks_for_project(self.token1, project.pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # check the response
        decoded = json.loads(response.content.decode())
        decoded = test_utils.get_paginated_results(decoded)

        # should contain exactly two Tasks
        self.assertEqual(len(decoded), 2)

        # update first task
        response = self.rest_update_task(
            self.token1,
            task.pk,
            project.pk,
            "Test Task Title",
            "Test Task Description",
            Task.TASK_STATE_DONE,
            Task.TASK_PRIORITY_VERY_HIGH,
            datetime.now(),
            datetime.now() + timedelta(days=30),
            self.user1.pk,
            HTTP_USER_AGENT,
            REMOTE_ADDR,
        )
        decoded = json.loads(response.content.decode())
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # get task object from db
        task = Task.objects.get(pk=decoded["pk"])
        self.assertEqual(task.title, "Test Task Title")

    def test_create_and_edit_of_own_task(self):
        """
        Tests creating and editing of a task with the same user (should work) and with a different user
        (which should not work)
        """
        # add permission for creating Tasks to the current user
        self.user1.user_permissions.add(self.add_task_without_project_permission)

        # there should be zero Tasks to begin with
        self.assertEqual(Task.objects.all().count(), 0, msg="There should be zero Tasks to begin with")

        # try creating a task without a project
        task, response = self.create_task_orm(
            self.token1,
            None,
            "Test Task",
            "Test Description",
            Task.TASK_STATE_NEW,
            Task.TASK_PRIORITY_HIGH,
            datetime.now(),
            datetime.now() + timedelta(days=30),
            self.user1.pk,
            HTTP_USER_AGENT,
            REMOTE_ADDR,
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # there should now be one task
        self.assertEqual(Task.objects.all().count(), 1, msg="There should be one task in the database")

        # try edit this task with user1
        response = self.rest_update_task(
            self.token1,
            task.pk,
            None,
            "Test Task",
            "Test Description",
            Task.TASK_STATE_NEW,
            Task.TASK_PRIORITY_HIGH,
            datetime.now(),
            datetime.now() + timedelta(days=30),
            self.user1.pk,
            HTTP_USER_AGENT,
            REMOTE_ADDR,
        )

        decoded = json.loads(response.content.decode())
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # try reading infos about this task with user2 (should not work)
        response = self.rest_get_task(self.token2, decoded["pk"], HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

        # try updating this task with user2 (should also not work)
        response = self.rest_update_task(
            self.token2,
            decoded["pk"],
            None,
            "Test Task",
            "Test Description",
            Task.TASK_STATE_NEW,
            Task.TASK_PRIORITY_HIGH,
            datetime.now(),
            datetime.now() + timedelta(days=30),
            self.user1.pk,
            HTTP_USER_AGENT,
            REMOTE_ADDR,
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_task_start_date_before_end_date(self):
        """
        Tests the model validation for task:
        - start_date needs to be before end_date
        """
        response = self.rest_create_task(
            self.token1,
            None,
            "Test Title",
            "Test Desription",
            Task.TASK_STATE_NEW,
            Task.TASK_PRIORITY_HIGH,
            datetime.now(),
            datetime.now() - timedelta(seconds=1),
            [],
            HTTP_USER_AGENT,
            REMOTE_ADDR,
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        decoded_response = json.loads(response.content.decode())
        self.assertTrue("due_date" in decoded_response)
        self.assertTrue("start_date" in decoded_response)
        self.assertEqual(decoded_response["start_date"][0], _("Start date must be before end date"))
