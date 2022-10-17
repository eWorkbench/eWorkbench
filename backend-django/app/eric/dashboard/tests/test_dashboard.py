#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import json

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group, Permission
from django.core.exceptions import ValidationError
from django.utils import timezone
from django.utils.timezone import datetime, timedelta

from rest_framework import status
from rest_framework.test import APITestCase

from eric.dashboard.tests.core import DashboardMixin
from eric.projects.models import Project
from eric.projects.tests.core import AuthenticationMixin, ProjectsMixin
from eric.shared_elements.models import Task
from eric.shared_elements.tests.core import ContactMixin, MeetingMixin, NoteMixin, TaskMixin

User = get_user_model()


HTTP_USER_AGENT = "APITestClient"
REMOTE_ADDR = "127.0.0.1"


class DashboardTest(APITestCase, AuthenticationMixin, DashboardMixin, ProjectsMixin, TaskMixin):
    """
    Tests the /my/dashboard endpoint
    """

    def setUp(self):
        """
        Set up a couple of users
        :return:
        """
        self.student_role = self.create_student_role()

        self.user_group = Group.objects.get(name="User")

        self.user1 = User.objects.create_user(username="student_1", email="student_1@email.com", password="top_secret")
        self.token1 = self.login_and_return_token("student_1", "top_secret")
        self.user1.groups.add(self.user_group)

        self.user2 = User.objects.create_user(username="student_2", email="student_2@email.com", password="foobar")
        self.token2 = self.login_and_return_token("student_2", "foobar")
        self.user2.groups.add(self.user_group)

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

    def test_my_dashboard(self):
        """
        Tests the /my/dashboard endpoint (basic tests)
        Should return several lists
        :return:
        """
        response = self.rest_get_my_dashboard(self.token1, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        decoded_response = json.loads(response.content.decode())

        self.assertTrue("projects" in decoded_response, msg="/my/dashboard contains projects")
        self.assertTrue("contacts" in decoded_response, msg="/my/dashboard contains contacts")
        self.assertTrue("dmps" in decoded_response, msg="/my/dashboard contains dmps")
        self.assertTrue("files" in decoded_response, msg="/my/dashboard contains files")
        self.assertTrue("tasks" in decoded_response, msg="/my/dashboard contains tasks")
        self.assertTrue("resources" in decoded_response, msg="/my/dashboard contains resources")

    def test_only_viewable_projects_in_dashboard(self):
        """
        Tests that the /my/dashboard endpoint only contains projects that are viewable by the current user
        :return:
        """
        # fetch dashboard with user1
        response = self.rest_get_my_dashboard(self.token1, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        decoded_response = json.loads(response.content.decode())

        # there should be one project in the dashboard of user 1
        self.assertEqual(len(decoded_response["projects"]), 1, msg="User1 should have one project in dashboard")
        self.assertEqual(decoded_response["projects"][0]["pk"], str(self.project1.pk))

        # fetch dashboard with user2
        response = self.rest_get_my_dashboard(self.token2, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        decoded_response = json.loads(response.content.decode())

        # there should be one project in this dashboard
        self.assertEqual(len(decoded_response["projects"]), 1, msg="User2 should have one project in dashboard")
        self.assertEqual(decoded_response["projects"][0]["pk"], str(self.project2.pk))

    def test_only_viewable_tasks_in_dashboard(self):
        """
        Tests that the /my/dashboard endpoint only contains tasks that are viewable by the current user
        :return:
        """
        # create a task with user1
        response = self.rest_create_task(
            self.token1,
            None,
            "Some title",
            "Some description",
            Task.TASK_STATE_NEW,
            Task.TASK_PRIORITY_NORMAL,
            timezone.now(),
            timezone.now() + timedelta(hours=1),
            [self.user1.pk],
            HTTP_USER_AGENT,
            REMOTE_ADDR,
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # fetch dashboard with user1
        response = self.rest_get_my_dashboard(self.token1, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        decoded_response = json.loads(response.content.decode())

        # there should be one project in the dashboard of user 1
        self.assertEqual(len(decoded_response["tasks"]), 1, msg="User1 should have one task in dashboard")

        # fetch dashboard with user2
        response = self.rest_get_my_dashboard(self.token2, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        decoded_response = json.loads(response.content.decode())

        # there should be zero tasks in this dashboard
        self.assertEqual(len(decoded_response["tasks"]), 0, msg="User2 should have zero projects in dashboard")
