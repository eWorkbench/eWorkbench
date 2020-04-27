#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import json
from django.core.exceptions import ValidationError
from django.contrib.auth.models import Group
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Permission
from django.utils.timezone import datetime

from rest_framework.test import APITestCase
from rest_framework import status

from eric.projects.models import Project, ProjectRoleUserAssignment, Role
from eric.shared_elements.models import Note
from eric.projects.tests.core import AuthenticationMixin, UserMixin, ProjectsMixin
from eric.shared_elements.tests.core import NoteMixin, TaskMixin, ContactMixin


User = get_user_model()

# read http://www.django-rest-framework.org/api-guide/testing/ for more info about testing with django rest framework
HTTP_USER_AGENT = "APITestClient"
REMOTE_ADDR = "127.0.0.1"


class HistoryTest(APITestCase, AuthenticationMixin, ProjectsMixin, TaskMixin, ContactMixin):
    """ Testing of permissions of the project endpoint """

    # set up users
    def setUp(self):
        """ set up a couple of users """
        """ Set up a couple of users and roles and projects """
        self.student_role = self.create_student_role()

        self.pm_role = Role.objects.filter(default_role_on_project_create=True).first()

        self.user_group = Group.objects.get(name='User')

        # get add_note and add_note_without_project permission
        self.add_note_permission = Permission.objects.filter(
            codename='add_note',
            content_type=Note.get_content_type()
        ).first()

        self.add_note_without_project_permission = Permission.objects.filter(
            codename='add_note_without_project',
            content_type=Note.get_content_type()
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
            "Only user1 has access to this project", "START",
            HTTP_USER_AGENT, REMOTE_ADDR
        )

        self.project2 = self.create_project(
            self.token2, "Another Project (user2)",
            "Only user2 has access to this project", "START",
            HTTP_USER_AGENT, REMOTE_ADDR
        )

    def test_project_changeset(self):
        """
        Tests the changeset/history of a project
        :return:
        """

        response = self.client.get(
            '/api/projects/{project_id}/history/'.format(project_id=self.project1.pk),
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

        self.assertEquals(response.status_code, status.HTTP_200_OK)
        decoded = json.loads(response.content.decode())

        self.assertTrue('results' in decoded, msg="History is paginated")
        self.assertEquals(decoded['count'], 1)
        decoded = decoded['results']

        # there should be exactly one entry in history, the creation of the project
        self.assertEquals(len(decoded), 1)
        # this should be an insert
        self.assertEquals(decoded[0]['changeset_type'], 'I')
        # by user1
        self.assertEquals(decoded[0]['user']['username'], 'student_1')
        # for project with pk
        self.assertEquals(decoded[0]['object_uuid'], str(self.project1.pk))

        response = self.client.get(
            '/api/projects/{project_id}/history/'.format(project_id=self.project2.pk),
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

        self.assertEquals(response.status_code, status.HTTP_200_OK)
        decoded = json.loads(response.content.decode())

        self.assertTrue('results' in decoded, msg="History is paginated")
        self.assertEquals(decoded['count'], 2)
        decoded = decoded['results']

        # there should be exactly two entries in history, the creation of the project and the assigned user
        self.assertEquals(len(decoded), 2)
        # first entry should be the assigned user
        self.assertEquals(decoded[0]['changeset_type'], 'I')
        # by user1
        self.assertEquals(decoded[0]['user']['username'], 'student_2')
        self.assertEquals(decoded[0]['object_type']['model'], "projectroleuserassignment")


        # this should be an insert of the project
        self.assertEquals(decoded[1]['changeset_type'], 'I')
        # by user1
        self.assertEquals(decoded[1]['user']['username'], 'student_2')
        self.assertEquals(decoded[1]['object_type']['model'], "project")
        # for project with pk
        self.assertEquals(decoded[1]['object_uuid'], str(self.project2.pk))

    def test_history_permissions(self):
        """
        The history endpoint should only be visible for elements that the current user has view access to
        :return:
        """
        # create a new task with user1
        response = self.rest_create_task(
            self.token1,
            None, "Test Title", "Test Description", "NEW", "HIGH",
            datetime.now(), datetime.now(), self.user1.pk,
            HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEquals(response.status_code, status.HTTP_201_CREATED)
        task = json.loads(response.content.decode())

        # try to access task history with user1
        response = self.client.get(
            '/api/tasks/{task_id}/history/'.format(task_id=task['pk']),
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )
        self.assertEquals(response.status_code, status.HTTP_200_OK)
        history = json.loads(response.content.decode())
        # should be paginated
        self.assertTrue('count' in history, msg="History should be paginated")
        self.assertTrue('results' in history, msg="History should be paginated")

        self.assertEquals(history['count'], 1, msg="There should be exactly one history entry")

        history = history['results']

        # should have 1 entry (create)
        self.assertEquals(len(history), 1, msg="There should be exactly one history entry")
        self.assertEquals(history[0]['user']['pk'], self.user1.pk, msg="First history object was created by user1")
        self.assertEquals(history[0]['object_uuid'], task['pk'], msg="First history object is related to the given task")

        # try to access task history with user2 (should not work)
        self.set_client_credentials(self.token2)
        # try to access task history with user1
        response = self.client.get(
            '/api/tasks/{task_id}/history/'.format(task_id=task['pk']),
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )
        self.assertEquals(response.status_code, status.HTTP_404_NOT_FOUND)
