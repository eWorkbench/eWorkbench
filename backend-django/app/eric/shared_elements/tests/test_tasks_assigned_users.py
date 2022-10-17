#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import json

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group, Permission
from django.utils.timezone import datetime, timedelta

from rest_framework import status
from rest_framework.test import APITestCase

from eric.core.tests import HTTP_USER_AGENT, REMOTE_ADDR, test_utils
from eric.projects.models import Project, Role
from eric.projects.tests.core import AuthenticationMixin, ProjectsMixin, UserMixin
from eric.shared_elements.models import Task
from eric.shared_elements.tests.core import TaskMixin

User = get_user_model()


class TasksAssignedUsersTest(APITestCase, AuthenticationMixin, UserMixin, TaskMixin, ProjectsMixin):
    """
    Tests the /api/tasks endpoint for assigned users
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

    def test_user_can_see_assigned_tasks(self):
        """Tests whether a user can see tasks that he does not own, but are assigned to them"""
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

        # try creating a task without a project for user1 (token1), but assigned to user2
        response = self.rest_create_task(
            self.token1,
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
        self.assertEqual(len(decoded), 2, msg="There should only be two tasks visible for user1")

        # try quering the rest endpoint for user2 - there should only be one task
        response = self.rest_get_tasks(self.token2, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # check the response
        decoded = json.loads(response.content.decode())
        decoded = test_utils.get_paginated_results(decoded)
        # should contain exactly no Tasks
        self.assertEqual(len(decoded), 1, msg="There should only be one task visible for user2")

    def test_assigned_users_permission(self):
        """
        Tests the permission of assigned users of a task:
        - Assigned Users can view the task
        - Assigned Users can NOT edit the task (unless they created the task or have the permission within a project)
        :return:
        """
        # there should be zero Tasks to begin with
        self.assertEqual(Task.objects.all().count(), 0, msg="There should be zero Tasks to begin with")

        # self.user3.user_permissions.add(self.add_task_permission)

        # try creating a task without a project by user1 and assigned to user1
        response = self.rest_create_task(
            self.token1,
            None,
            "Important Task",
            "Please do it ASAP",
            Task.TASK_STATE_NEW,
            Task.TASK_PRIORITY_HIGH,
            datetime.now(),
            datetime.now() + timedelta(days=1),
            self.user1.pk,
            HTTP_USER_AGENT,
            REMOTE_ADDR,
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        task1 = json.loads(response.content.decode())

        # there should only be one task
        self.assertEqual(Task.objects.all().count(), 1, msg="There should be one task")

        # user1 should be able to change this task
        response = self.rest_update_task(
            self.token1,
            task1["pk"],
            None,
            task1["title"] + "!!!11",
            task1["description"] + "!",
            task1["state"],
            task1["priority"],
            task1["start_date"],
            task1["due_date"],
            task1["assigned_users"][0]["pk"],
            HTTP_USER_AGENT,
            REMOTE_ADDR,
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # however, user2 should not be able to change this task
        response = self.rest_update_task(
            self.token2,
            task1["pk"],
            None,
            task1["title"] + "....",
            task1["description"] + "?!?!?",
            task1["state"],
            task1["priority"],
            task1["start_date"],
            task1["due_date"],
            task1["assigned_users"][0]["pk"],
            HTTP_USER_AGENT,
            REMOTE_ADDR,
        )

        self.assertIn(response.status_code, [status.HTTP_404_NOT_FOUND, status.HTTP_403_FORBIDDEN])

        # in fact, user2 should not even be able to VIEW this task
        response = self.rest_get_task(self.token2, task1["pk"], HTTP_USER_AGENT, REMOTE_ADDR)

        self.assertIn(response.status_code, [status.HTTP_404_NOT_FOUND, status.HTTP_403_FORBIDDEN])

        # lets assign user2 to this task
        response = self.rest_update_task(
            self.token1,
            task1["pk"],
            None,
            task1["title"],
            task1["description"],
            task1["state"],
            task1["priority"],
            task1["start_date"],
            task1["due_date"],
            self.user2.pk,
            HTTP_USER_AGENT,
            REMOTE_ADDR,
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # unlock task1 with user1
        response = self.unlock(self.token1, "tasks", task1["pk"], HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # now user2 should be able to view this task
        response = self.rest_get_task(self.token2, task1["pk"], HTTP_USER_AGENT, REMOTE_ADDR)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # however, user2 is still not allowed to edit this task
        response = self.rest_update_task(
            self.token2,
            task1["pk"],
            None,
            task1["title"],
            "No way!",
            task1["state"],
            task1["priority"],
            task1["start_date"],
            task1["due_date"],
            task1["assigned_users"][0]["pk"],
            HTTP_USER_AGENT,
            REMOTE_ADDR,
        )

        self.assertIn(response.status_code, [status.HTTP_404_NOT_FOUND, status.HTTP_403_FORBIDDEN])

        # user1 is still able to edit the task, as user1 created the task
        response = self.rest_update_task(
            self.token1,
            task1["pk"],
            None,
            task1["title"],
            "No way!",
            task1["state"],
            task1["priority"],
            task1["start_date"],
            task1["due_date"],
            task1["assigned_users"][0]["pk"],
            HTTP_USER_AGENT,
            REMOTE_ADDR,
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_multiple_assigned_users(self):
        """
        Tests whether it is possible to assign multiple users to a task, and whether these users get view access to the
        task
        :return:
        """
        # there should be zero Tasks to begin with
        self.assertEqual(Task.objects.all().count(), 0, msg="There should be zero Tasks to begin with")

        # try creating a task without a project by user1 and assigned to user1
        response = self.rest_create_task(
            self.token1,
            None,
            "Important Task",
            "Please do it ASAP",
            Task.TASK_STATE_NEW,
            Task.TASK_PRIORITY_HIGH,
            datetime.now(),
            datetime.now() + timedelta(days=1),
            self.user1.pk,
            HTTP_USER_AGENT,
            REMOTE_ADDR,
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        task1 = json.loads(response.content.decode())

        # there should only be one task
        self.assertEqual(Task.objects.all().count(), 1, msg="There should be one task")

        # try to retrieve the task with user2 (should not work)
        response = self.rest_get_task(self.token2, task1["pk"], HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertIn(response.status_code, [status.HTTP_404_NOT_FOUND, status.HTTP_403_FORBIDDEN])

        # try to assign another user to this task with user2 (should not work, as user2 does not have edit roles)
        response = self.rest_update_task_assigned_users(
            self.token2, task1["pk"], [self.user1.pk, self.user2.pk], HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertIn(response.status_code, [status.HTTP_404_NOT_FOUND, status.HTTP_403_FORBIDDEN])

        # verify the number of assigned user for this task
        self.assertEqual(
            len(Task.objects.filter(pk=task1["pk"]).first().assigned_users.all()),
            1,
            msg="Verify there is only one assigned user",
        )
        # verify this user is user1
        self.assertEqual(Task.objects.filter(pk=task1["pk"]).first().assigned_users.all().first().pk, self.user1.pk)

        # try to assign another user to this task
        response = self.rest_update_task_assigned_users(
            self.token1, task1["pk"], [self.user1.pk, self.user2.pk], HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # unlock task with user1
        response = self.unlock(self.token1, "tasks", task1["pk"], HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.assertEqual(
            len(Task.objects.filter(pk=task1["pk"]).first().assigned_users.all()),
            2,
            msg="Verify there are two assigned user",
        )
        # try to remove user1 with user2 (should work)
        response = self.rest_update_task_assigned_users(
            self.token2, task1["pk"], [self.user2.pk], HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # there should now only be one users
        self.assertEqual(
            len(Task.objects.filter(pk=task1["pk"]).first().assigned_users.all()),
            1,
            msg="Verify there is only one user",
        )

        # verify user1 can still see the task (as he/she is the owner)
        response = self.rest_get_task(self.token1, task1["pk"], HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # verify user2 can also still see the task (as he/she is assigned to the task)
        response = self.rest_get_task(self.token2, task1["pk"], HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
