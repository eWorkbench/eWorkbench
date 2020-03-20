#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import json
from django.core.exceptions import ValidationError
from django.contrib.auth.models import Group, Permission
from django.contrib.auth import get_user_model

from rest_framework.test import APITestCase
from rest_framework import status

from eric.projects.tests.core import AuthenticationMixin

from eric.texttemplates.models import TextTemplate

User = get_user_model()

# read http://www.django-rest-framework.org/api-guide/testing/ for more info about testing with django rest framework
HTTP_USER_AGENT = "APITestClient"
REMOTE_ADDR = "127.0.0.1"


class TextTemplatesTest(APITestCase, AuthenticationMixin):
    """ Extensive testing of project endpoint """

    # set up users
    def setUp(self):
        """ set up a couple of users """
        # get user group
        self.user_group = Group.objects.get(name='User')

        # create 4 users and assign them to the user group
        self.user1 = User.objects.create_user(
            username='student_1', email='student_1@email.com', password='top_secret')
        self.user1.groups.add(self.user_group)

        self.student_role = self.create_student_role()

    def rest_retrieve_text_templates(self, auth_token, HTTP_USER_AGENT, REMOTE_ADDR):
        """ REST wrapper for retrieving text templates """
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + auth_token)

        return self.client.get(
            '/api/texttemplates/',
            {}, HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def test_text_templates(self):
        # check that there are no text templates
        self.assertEqual(TextTemplate.objects.all().count(), 0)
        # create TextTemplates
        TextTemplate.objects.create(name="Test Template 1", content="Test Content 1")
        self.assertEqual(TextTemplate.objects.all().count(), 1)
        TextTemplate.objects.create(name="Test Template 2", content="Test Content 2")
        self.assertEqual(TextTemplate.objects.all().count(), 2)

        # login
        token = self.login_and_return_token('student_1', 'top_secret', HTTP_USER_AGENT, REMOTE_ADDR)
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + token)

        # get all text templates from REST API
        response = self.rest_retrieve_text_templates(token, HTTP_USER_AGENT, REMOTE_ADDR)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        decoded = json.loads(response.content.decode())
        # should be exactly 2
        self.assertEqual(len(decoded), 2)

        # validate that name and content are in the decoded response
        self.assertTrue('name' in decoded[0], msg="Attribute name is in text template response from REST API")
        self.assertTrue('content' in decoded[0], msg="Attribute content is in text template response from REST API")

        self.assertTrue('name' in decoded[1], msg="Attribute name is in text template response from REST API")
        self.assertTrue('content' in decoded[1], msg="Attribute content is in text template response from REST API")
