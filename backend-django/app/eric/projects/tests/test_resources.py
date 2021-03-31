#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import json

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group, Permission
from rest_framework import status
from rest_framework.test import APITestCase

from eric.core.tests import test_utils, HTTP_INFO, HTTP_USER_AGENT, REMOTE_ADDR
from eric.projects.models import Role, Resource, Project
from eric.projects.tests.core import AuthenticationMixin, UserMixin, ProjectsMixin, ResourceMixin

User = get_user_model()


class ResourcesTest(APITestCase, AuthenticationMixin, UserMixin, ResourceMixin, ProjectsMixin):
    """
    Tests the /api/resources endpoint
    Tests for creating, retrieving and updating Resources
    Tests for Resources that are project-related and not project-related (permissions)
    Tests for PDF upload validation
    """

    def setUp(self):
        """ Set up a couple of users and roles and projects """
        self.student_role = self.create_student_role()
        self.pm_role = Role.objects.filter(default_role_on_project_create=True).first()
        self.user_group = Group.objects.get(name='User')

        # get add_resource and add_resource_without_project permission
        self.add_resource_permission = Permission.objects.filter(
            codename='add_resource',
            content_type=Resource.get_content_type()
        ).first()

        self.add_resource_without_project_permission = Permission.objects.filter(
            codename='add_resource_without_project',
            content_type=Resource.get_content_type()
        ).first()

        self.user1 = User.objects.create_user(
            username='student_1', email='student_1@email.com', password='top_secret')
        self.token1 = self.login_and_return_token('student_1', 'top_secret')
        self.user1.groups.add(self.user_group)

        self.user2 = User.objects.create_user(
            username='student_2', email='student_2@email.com', password='foobar')
        self.token2 = self.login_and_return_token('student_2', 'foobar')
        self.user2.groups.add(self.user_group)

        # create a user without any special permissions
        self.user3 = User.objects.create_user(
            username='student_3', email='student_3@email.com', password='permission'
        )
        self.token3 = self.login_and_return_token('student_3', 'permission')

        # create a user without any special permissions
        self.user4 = User.objects.create_user(
            username='student_4', email='student_4@email.com', password='permission4'
        )
        self.token4 = self.login_and_return_token('student_4', 'permission4')

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

        # add user3 to project1 as student
        self.rest_assign_user_to_project(
            self.token1, self.project1, self.user3, self.student_role,
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

        # add user4 to project1 as pm
        self.rest_assign_user_to_project(
            self.token1, self.project1, self.user4, self.pm_role,
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def test_create_resource(self):
        """
        Tests creating a resource
        :return:
        """
        # there should be zero Resources to begin with
        self.assertEquals(Resource.objects.all().count(), 0, msg="There should be zero Resources to begin with")

        # creating a resource for a project1 should work for user1
        response = self.rest_create_resource(
            self.token1,
            self.project1.pk,
            "Test Resource",
            "Test Description",
            Resource.ROOM,
            Resource.GLOBAL,
            HTTP_USER_AGENT,
            REMOTE_ADDR
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        self.assertEquals(Resource.objects.all().count(), 1, msg="There should be one resource")

        # however, creating a resource for a project1 should also work for user3
        response = self.rest_create_resource(
            self.token4,
            self.project1.pk,
            "Test Resource",
            "Test Description",
            Resource.ROOM,
            Resource.GLOBAL,
            HTTP_USER_AGENT,
            REMOTE_ADDR
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        self.assertEquals(Resource.objects.all().count(), 2, msg="There should be two resources")

    def test_pdf_upload(self):
        """checks if pdf upload is validated correctly"""

        terms_of_use_pdf = "valid.pdf"

        # create a resource with a pdf
        response = self.rest_create_resource(
            self.token1,
            self.project1.pk,
            "Test Resource",
            "Test Description",
            Resource.ROOM,
            Resource.GLOBAL,
            HTTP_USER_AGENT,
            REMOTE_ADDR,
            terms_of_use_pdf=terms_of_use_pdf,
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_invalid_uploads(self):
        """checks if pdf upload is validated correctly"""

        invalid_file_1 = "invalid.json"
        invalid_file_2 = "invalid.png"

        # dont create a resource with a json
        response = self.rest_create_resource(
            self.token3,
            self.project1.pk,
            "Test Resource",
            "Test Description",
            Resource.ROOM,
            Resource.GLOBAL,
            HTTP_USER_AGENT,
            REMOTE_ADDR,
            terms_of_use_pdf=invalid_file_1,
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.content.decode(), '{"terms_of_use_pdf":["File extension must be .pdf"]}')

        # dont create a resource with a png
        response = self.rest_create_resource(
            self.token3,
            self.project1.pk,
            "Test Resource",
            "Test Description",
            Resource.ROOM,
            Resource.GLOBAL,
            HTTP_USER_AGENT,
            REMOTE_ADDR,
            terms_of_use_pdf=invalid_file_2,
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.content.decode(), '{"terms_of_use_pdf":["File extension must be .pdf"]}')

    def test_resource_without_title_can_not_be_created(self):
        # there should be zero Resources to begin with
        self.assertEquals(Resource.objects.all().count(), 0, msg="There should be zero Resources to begin with")

        # check: empty name
        response = self.rest_create_resource(
            auth_token=self.token1,
            project_pks=self.project1.pk,
            name="",
            description="Test Description",
            resource_type=Resource.ROOM,
            user_availability=Resource.GLOBAL,
            **HTTP_INFO
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        # check: whitespace name
        response = self.rest_create_resource(
            auth_token=self.token1,
            project_pks=self.project1.pk,
            name="     ",
            description="Test Description",
            resource_type=Resource.ROOM,
            user_availability=Resource.GLOBAL,
            **HTTP_INFO
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        # check: no name
        # using self.rest_create_resource(name=None) will just send the string "None"
        # therefore we need to use a custom post request without the "name" attribute
        data = {
            'description': "my resource description",
            'type': Resource.LAB_EQUIPMENT,
        }
        response = self.client.post(
            '/api/resources/',
            data,
            format='multipart',
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        # check that no resources have been created
        self.assertEqual(0, Resource.objects.count())

    def test_user_availability(self):
        # there should be zero Resources to begin with
        self.assertEquals(Resource.objects.all().count(), 0, msg="There should be zero Resources to begin with")

        ## GLOBAL
        # create 2 global resources in different projects
        response = self.rest_create_resource(
            auth_token=self.token1,
            project_pks=self.project1.pk,
            name="Test Resource 1",
            description="Test Description",
            resource_type=Resource.ROOM,
            user_availability=Resource.GLOBAL,
            **HTTP_INFO
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        response = self.rest_create_resource(
            auth_token=self.token2,
            project_pks=self.project2.pk,
            name="Test Resource 2",
            description="Test Description",
            resource_type=Resource.ROOM,
            user_availability=Resource.GLOBAL,
            **HTTP_INFO
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # all users should be able to see 2 resources
        self.assertEqual(len(test_utils.get_paginated_results(json.loads(
            self.rest_get_resources(auth_token=self.token1, **HTTP_INFO).content.decode()))), 2)
        self.assertEqual(len(test_utils.get_paginated_results(json.loads(
            self.rest_get_resources(auth_token=self.token2, **HTTP_INFO).content.decode()))), 2)
        self.assertEqual(len(test_utils.get_paginated_results(json.loads(
            self.rest_get_resources(auth_token=self.token3, **HTTP_INFO).content.decode()))), 2)

        ## PROJECT
        response = self.rest_create_resource(
            auth_token=self.token1,
            project_pks=self.project1.pk,
            name="Test Resource 3",
            description="Test Description",
            resource_type=Resource.ROOM,
            user_availability=Resource.PROJECT,
            **HTTP_INFO
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        resource3 = json.loads(response.content.decode())

        # unlock resource3 with user1
        response = self.unlock(self.token1, "resources", resource3['pk'], HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        response = self.rest_get_resource(
            self.token2, resource3['pk'], HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertIn(response.status_code, [status.HTTP_404_NOT_FOUND, status.HTTP_403_FORBIDDEN])

        # users 1 and 3 should be able to see 3 resources now, user2 still has 2
        self.assertEqual(len(test_utils.get_paginated_results(json.loads(
            self.rest_get_resources(auth_token=self.token1, **HTTP_INFO).content.decode()))), 3)
        self.assertEqual(len(test_utils.get_paginated_results(json.loads(
            self.rest_get_resources(auth_token=self.token2, **HTTP_INFO).content.decode()))), 2)
        self.assertEqual(len(test_utils.get_paginated_results(json.loads(
            self.rest_get_resources(auth_token=self.token3, **HTTP_INFO).content.decode()))), 3)

        # ## SELECTED_USERS
        self.user2.user_permissions.add(self.add_resource_without_project_permission)
        # now let's create a resource without a project but select user1 to also view
        response4 = self.rest_create_resource(
            auth_token=self.token2,
            project_pks=None,
            name="Test Resource 4",
            description="Test Description",
            resource_type=Resource.ROOM,
            user_availability=Resource.SELECTED_USERS,
            user_availability_selected_user_pks=[self.user1.pk],
            **HTTP_INFO
        )
        self.assertEqual(response4.status_code, status.HTTP_201_CREATED)
        # user1 should see 4, user2 should see 3 and user3 still has 3 resources
        self.assertEqual(len(test_utils.get_paginated_results(json.loads(
            self.rest_get_resources(auth_token=self.token1, **HTTP_INFO).content.decode()))), 4)
        self.assertEqual(len(test_utils.get_paginated_results(json.loads(
            self.rest_get_resources(auth_token=self.token2, **HTTP_INFO).content.decode()))), 3)
        self.assertEqual(len(test_utils.get_paginated_results(json.loads(
            self.rest_get_resources(auth_token=self.token3, **HTTP_INFO).content.decode()))), 3)
