#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import json
from django.core.exceptions import ValidationError
from django.contrib.auth.models import Group
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Permission
from django.utils.timezone import datetime, timedelta

from rest_framework.test import APITestCase
from rest_framework import status

from eric.projects.models import Project, ProjectRoleUserAssignment, Role
from eric.projects.tests.core import AuthenticationMixin, UserMixin, ProjectsMixin, MeMixin
from eric.shared_elements.tests.core import TaskMixin, MeetingMixin

from eric.shared_elements.models import Task, Meeting

User = get_user_model()

# read http://www.django-rest-framework.org/api-guide/testing/ for more info about testing with django rest framework

HTTP_USER_AGENT = "APITestClient"
REMOTE_ADDR = "127.0.0.1"


class MyEndpointsTest(APITestCase, AuthenticationMixin, UserMixin, TaskMixin, MeetingMixin, ProjectsMixin, MeMixin):
    """
    Tests the /my endpoints
    - /me
    - /my/tasks
    - /my/meetings
    - /my/schedule
    """

    def setUp(self):
        """ Set up a couple of users and roles and projects """
        self.student_role = self.create_student_role()

        self.pm_role = Role.objects.filter(default_role_on_project_create=True).first()

        self.user_group = Group.objects.get(name='User')

        # get add_task and add_task_without_project permission
        self.add_task_without_project_permission = Permission.objects.filter(
            codename='add_task_without_project',
            content_type=Task.get_content_type()
        ).first()

        self.add_meeting_without_project_permission = Permission.objects.filter(
            codename='add_meeting_without_project',
            content_type=Meeting.get_content_type()
        ).first()

        self.user1 = User.objects.create_user(
            username='student_1', email='student_1@email.com', password='top_secret')
        self.token1 = self.login_and_return_token('student_1', 'top_secret')
        self.user1.groups.add(self.user_group)

        self.user2 = User.objects.create_user(
            username='student_2', email='student_2@email.com', password='foobar')
        self.token2 = self.login_and_return_token('student_2', 'foobar')
        self.user2.groups.add(self.user_group)

        # create two projects
        self.project1 = self.create_project(
            self.token1, "My Own Project (user1)",
            "Only user1 has access to this project", Project.STARTED,
            HTTP_USER_AGENT, REMOTE_ADDR
        )

        self.project2 = self.create_project(
            self.token2, "Another Project (user2)",
            "Only user2 has access to this project", Project.STARTED,
            HTTP_USER_AGENT, REMOTE_ADDR
        )

    def test_api_me(self):
        """
        Tests the /api/me endpoint
        :return:
        """
        response = self.rest_get_me(self.token1, assert_status=status.HTTP_200_OK)
        decoded = json.loads(response.content.decode())

        print(decoded)
        self.assertTrue('pk' in decoded)
        self.assertTrue('username' in decoded)
        self.assertTrue('userprofile' in decoded)
        self.assertTrue('permissions' in decoded)

        self.assertEquals(decoded['username'], "student_1")

        response = self.rest_get_me(self.token2, assert_status=status.HTTP_200_OK)
        decoded = json.loads(response.content.decode())

        print(decoded)
        self.assertTrue('pk' in decoded)
        self.assertTrue('username' in decoded)
        self.assertTrue('userprofile' in decoded)
        self.assertTrue('permissions' in decoded)

        self.assertEquals(decoded['username'], "student_2")

    def test_api_my_schedule(self):
        """
        Tests the "my schedule" aswell as "my tasks" and "my meetings" endpoint, which contains Tasks and Meetings
        """
        # give user permission for adding tasks and meetings
        self.user1.user_permissions.add(self.add_meeting_without_project_permission)
        self.user1.user_permissions.add(self.add_task_without_project_permission)

        task1, response = self.create_task_orm(
            self.token1, None,
            "some task title", "some task description",
            Task.TASK_STATE_NEW, Task.TASK_PRIORITY_VERY_HIGH,
            datetime.now(), datetime.now(), self.user1.pk,
            HTTP_USER_AGENT, REMOTE_ADDR
        )
        task2, response = self.create_task_orm(
            self.token1, None,
            "another task title", "another task description",
            Task.TASK_STATE_NEW, Task.TASK_PRIORITY_VERY_HIGH,
            datetime.now(), datetime.now(), self.user1.pk,
            HTTP_USER_AGENT, REMOTE_ADDR
        )

        meeting1, response = self.create_meeting_orm(self.token1, None,
                                                     "Meeting title", "meeting description",
                                                     datetime.now(), datetime.now(), HTTP_USER_AGENT, REMOTE_ADDR)

        meeting2, response = self.create_meeting_orm(self.token1, None,
                                                     "Another meeting title", "Another meeting description",
                                                     datetime.now(), datetime.now(), HTTP_USER_AGENT, REMOTE_ADDR)

        self.set_client_credentials(self.token1)

        # query the my schedule endpoint
        response = self.client.get(
            '/api/my/schedule/',
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        decoded = json.loads(response.content.decode())

        self.assertEquals(len(decoded), 4, msg="The my schedule endpoint should return 4 entities")

        # get a list of PKs
        pk_list = []
        type_list = []
        for entry in decoded:
            pk_list.append(entry['pk'])
            type_list.append(entry['content_type_model'])

        # verify that each objects PK is in pk_list
        self.assertTrue(str(task1.pk) in pk_list, msg="Verify that task1.pk is in pk_list")
        self.assertTrue(str(task2.pk) in pk_list, msg="Verify that task2.pk is in pk_list")
        self.assertTrue(str(meeting1.pk) in pk_list, msg="Verify that meeting1.pk is in pk_list")
        self.assertTrue(str(meeting2.pk) in pk_list, msg="Verify that meeting2.pk is in pk_list")

        # query the my tasks endpoint
        response = self.client.get(
            '/api/my/tasks/',
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        decoded = json.loads(response.content.decode())

        self.assertEquals(len(decoded), 2, msg="The my tasks endpoint should return 2 entities")
        self.assertEquals(decoded[0]['content_type_model'], "shared_elements.task")
        self.assertEquals(decoded[1]['content_type_model'], "shared_elements.task")

        # query the my meetings endpoint
        response = self.client.get(
            '/api/my/meetings/',
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        decoded = json.loads(response.content.decode())

        self.assertEquals(len(decoded), 2, msg="The my meetings endpoint should return 2 entities")
        self.assertEquals(decoded[0]['content_type_model'], "shared_elements.meeting")
        self.assertEquals(decoded[1]['content_type_model'], "shared_elements.meeting")









