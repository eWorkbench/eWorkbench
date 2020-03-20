#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import json
from django.contrib.auth.models import Group
from django.contrib.auth import get_user_model

User = get_user_model()

from rest_framework.test import APITestCase
from rest_framework import status
from eric.projects.models import Project

from eric.projects.tests.core import AuthenticationMixin, ProjectsMixin

# read http://www.django-rest-framework.org/api-guide/testing/ for more info about testing with django rest framework

HTTP_USER_AGENT = "APITestClient"
REMOTE_ADDR = "127.0.0.1"


class ProjectsWithoutAuthTest(APITestCase, AuthenticationMixin, ProjectsMixin):
    """ Some basic testing to verify that the /projects endpoint requires authentication in all cases """

    # set up users
    def setUp(self):
        """ Set up one user """
        # get user group
        self.user_group = Group.objects.get(name='User')

        # create a super secret project that nobody should have access to
        # create 4 users and assign them to the user group
        self.user1 = User.objects.create_user(
            username="student_1", email="student_1@email.com", password="top_secret")
        self.user1.groups.add(self.user_group)
        self.token1 = self.login_and_return_token("student_1", "top_secret", HTTP_USER_AGENT, REMOTE_ADDR)
        # project is automatically created

        self.assertEquals(Project.objects.all().count(), 1, msg="There should be one project in the database")

        self.project = Project.objects.all().first()

        self.reset_client_credentials()

    def test_create_without_auth(self):
        """ Tries to create a project without being authed """
        old_project_count = Project.objects.all().count()
        response = self.client.post('/api/projects/',
                                    {'name': "Test project name", 'description': "test project description",
                                     'project_state': "INIT"},
                                    HTTP_USER_AGENT="Test API", REMOTE_ADDR="127.0.0.1")
        self.assertIn(response.status_code, [status.HTTP_403_FORBIDDEN, status.HTTP_401_UNAUTHORIZED])

        self.assertEquals(Project.objects.all().count(), old_project_count, msg="There should be no additional projects in the database")

    def test_get_project_without_auth(self):
        """
        Tries to get the project in self.project without being authenticated
        This verifies that even if someone knows the project primary key, they are not able to retrieve any more
        information without being logged in
        """
        response = self.rest_get_project("some-invalid-token", self.project.pk, HTTP_USER_AGENT, REMOTE_ADDR)

        self.assertIn(response.status_code, [status.HTTP_403_FORBIDDEN, status.HTTP_401_UNAUTHORIZED])

    def test_update_project_without_auth(self):
        """
        Tries to update the project in self.project without being authenticated
        This verifies that even if someone knows the project primary key, they are not able to retrieve any more
        information without being logged in
        :return:
        """
        response = self.rest_edit_project("some-invalid-token", self.project.pk, "Test Project", "Test Description",
                                          "INIT", HTTP_USER_AGENT, REMOTE_ADDR)

        self.assertIn(response.status_code, [status.HTTP_403_FORBIDDEN, status.HTTP_401_UNAUTHORIZED])

    def test_get_all_projects_without_auth(self):
        """ Tries to do various things with the projects endpoint without being authenticated """
        # no auth
        self.reset_client_credentials()
        response = self.client.get('/api/projects/')
        self.assertIn(response.status_code, [status.HTTP_403_FORBIDDEN, status.HTTP_401_UNAUTHORIZED])
        response = self.client.post('/api/projects/')
        self.assertIn(response.status_code, [status.HTTP_403_FORBIDDEN, status.HTTP_401_UNAUTHORIZED])

        # wrong auth
        self.set_client_credentials("this-is-not-a-valid-token")
        response = self.client.get('/api/projects/')

        self.assertIn(response.status_code, [status.HTTP_403_FORBIDDEN, status.HTTP_401_UNAUTHORIZED])
        self.assertEqual(response.content.decode(), '{"detail":"Invalid token."}')

        response = self.client.post('/api/projects/')
        self.assertIn(response.status_code, [status.HTTP_403_FORBIDDEN, status.HTTP_401_UNAUTHORIZED])
        self.assertEqual(response.content.decode(), '{"detail":"Invalid token."}')

        # again wrong auth
        self.set_client_credentials("this-is-yet-another-invalid-token")
        response = self.client.get('/api/projects/')
        self.assertIn(response.status_code, [status.HTTP_403_FORBIDDEN, status.HTTP_401_UNAUTHORIZED])
        self.assertEqual(response.content.decode(), '{"detail":"Invalid token."}')

        response = self.client.post('/api/projects/')
        self.assertIn(response.status_code, [status.HTTP_403_FORBIDDEN, status.HTTP_401_UNAUTHORIZED])
        self.assertEqual(response.content.decode(), '{"detail":"Invalid token."}')

        # now try a token which has an invalid format (spaces)
        self.set_client_credentials("this is a token with spaces")
        response = self.client.get('/api/projects/')
        self.assertIn(response.status_code, [status.HTTP_403_FORBIDDEN, status.HTTP_401_UNAUTHORIZED])
        self.assertEqual(response.content.decode(),
                         '{"detail":"Invalid token header. Token string should not contain spaces."}')

        response = self.client.post('/api/projects/')
        self.assertIn(response.status_code, [status.HTTP_403_FORBIDDEN, status.HTTP_401_UNAUTHORIZED])
        self.assertEqual(response.content.decode(),
                         '{"detail":"Invalid token header. Token string should not contain spaces."}')
