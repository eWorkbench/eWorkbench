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

from eric.projects.models import Role, Project
from eric.projects.tests.core import AuthenticationMixin, ProjectsMixin

# read http://www.django-rest-framework.org/api-guide/testing/ for more info about testing with django rest framework

HTTP_USER_AGENT = "APITestClient"
REMOTE_ADDR = "127.0.0.1"


class DuplicateProjectTest(APITestCase, AuthenticationMixin, ProjectsMixin):
    """ Testing duplicate a project """

    # set up users
    def setUp(self):
        """ set up three users"""
        # get user group
        self.user_group = Group.objects.get(name='User')

        # create 3 users and assign two of them to the user group (user1, user2), the last one not
        self.user1 = User.objects.create_user(
            username='user_1', email='user_1@email.com', password='top_secret')
        self.user1.groups.add(self.user_group)

        self.user2 = User.objects.create_user(
            username='user_2', email='user_2@email.com', password='top_secret')
        self.user2.groups.add(self.user_group)

        self.user3 = User.objects.create_user(
            username='user_3', email='user_3@email.com', password='top_secret')

        self.token1 = self.login_and_return_token('user_1', 'top_secret')
        self.token2 = self.login_and_return_token('user_2', 'top_secret')
        self.token3 = self.login_and_return_token('user_3', 'top_secret')

        self.observer_role = Role.objects.filter(name="Observer").first()

        # create some projects with user1 to build up a project tree and assign user2 and user3 as observables
        # Project Tree:
        #   Project
        #       Sub Project 1
        #           Sub Sub Project 1
        #       Sub Project 2

        project = self.create_project(self.token1, "Project", "Project Description", "INIT",
                                      HTTP_USER_AGENT, REMOTE_ADDR)
        self.project_pk = project.pk

        sub_project_1 = self.create_project(self.token1, "Sub Project 1", "Project Description", "INIT",
                                            HTTP_USER_AGENT, REMOTE_ADDR)
        self.rest_set_parent_project(self.token1, sub_project_1, project)
        self.sub_project_1_pk = sub_project_1.pk

        sub_sub_project_1 = self.create_project(self.token1, "Sub Sub Project 1", "Project Description", "INIT",
                                                HTTP_USER_AGENT, REMOTE_ADDR)
        self.rest_set_parent_project(self.token1, sub_sub_project_1, sub_project_1)

        sub_project_2 = self.create_project(self.token1, "Sub Project 2", "Project Description", "INIT",
                                            HTTP_USER_AGENT, REMOTE_ADDR)
        self.rest_set_parent_project(self.token1, sub_project_2, project)
        self.sub_project_2_pk = sub_project_2.pk

        self.rest_assign_user_to_project(self.token1, project, self.user2, self.observer_role,
                                         HTTP_USER_AGENT, REMOTE_ADDR)
        self.rest_assign_user_to_project(self.token1, project, self.user3, self.observer_role,
                                         HTTP_USER_AGENT, REMOTE_ADDR)

    def test_duplicate_parent_project(self):
        """ Test for duplicating the parent project with its sub projects """

        # get the parent project with all sub projects
        response = self.rest_get_project(self.token1, self.project_pk, HTTP_USER_AGENT, REMOTE_ADDR)
        original_project = json.loads(response.content.decode())

        # duplicate project
        response = self.rest_duplicate_project(self.token1, original_project['pk'], HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_200_OK)
        decoded = json.loads(response.content.decode())
        project_pk = decoded['pk']
        # the duplicated project must have other pk than the original project
        self.assertNotEqual(project_pk, original_project['pk'],
                            msg="The duplicated project should not have the same pk as the original project")

        # the name of the duplicated project has to be: "Copy of + original name"
        name = decoded['name']
        self.assertEqual(name, "Copy of %s" % (original_project['name']),
                         msg="The name of the duplicated object should have 'Copy of' before the original name")

        # get sub projects of the original and duplicated project 'Project'
        original_sub_projects = Project.objects.filter(parent_project__id=original_project['pk'])
        duplicated_sub_projects = Project.objects.filter(parent_project__id=project_pk)

        # check those sub projects
        self.assertEqual(len(duplicated_sub_projects), len(original_sub_projects),
                         msg="The duplicate project has to have the same count of sub projects than the original "
                             "project")

        self.assertNotEqual(duplicated_sub_projects[0].pk, original_sub_projects[0].pk,
                            msg="The sub project PK of the duplicated project is not the same as the sub project pk of "
                                "the original project")
        self.assertEqual(duplicated_sub_projects[0].name, original_sub_projects[0].name,
                         msg="The sub project name of the duplicated project is the same as the sub project name of "
                             "the original project")

        self.assertNotEqual(duplicated_sub_projects[1].pk, original_sub_projects[1].pk,
                            msg="The sub project PK of the duplicated project is not the same as the sub project pk of "
                                "the original project")
        self.assertEqual(duplicated_sub_projects[1].name, original_sub_projects[1].name,
                         msg="The sub project name of the duplicated project is the same as the sub project name of "
                             "the original project")

        # get the sub project of the original and duplicated sub project 'Sub Project 1'
        original_sub_project = Project.objects.filter(parent_project__id=original_sub_projects[0].pk)
        duplicated_sub_project = Project.objects.filter(parent_project__id=duplicated_sub_projects[0].pk)

        # check this sub project
        self.assertEqual(len(duplicated_sub_project), len(original_sub_project),
                         msg="The duplicate project has to have the same count of sub projects than the original "
                             "project")

        self.assertNotEqual(duplicated_sub_project[0].pk, original_sub_project[0].pk,
                            msg="The sub sub project PK of the duplicated sub project is not the same as the sub sub"
                                "project pk of the original sub project")
        self.assertEqual(duplicated_sub_project[0].name, original_sub_project[0].name,
                         msg="The sub sub project name of the duplicated sub project is the same as the sub sub "
                             "project name of the original sub project")

    def test_duplicate_sub_project(self):
        """ Test for duplicating the sub project with sub projects and check if the duplicated project is now a parent
         project
         """

        # get the sub project
        response = self.rest_get_project(self.token1, self.sub_project_1_pk, HTTP_USER_AGENT, REMOTE_ADDR)
        original_sub_project = json.loads(response.content.decode())

        # duplicate project
        response = self.rest_duplicate_project(self.token1, original_sub_project['pk'], HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_200_OK)
        decoded = json.loads(response.content.decode())
        project_pk = decoded['pk']

        # the parent project of the duplicated project has to be None
        self.assertEqual(decoded['parent_project'], None,
                         msg="The duplicated sub project has now no parent project anymore")

        # get the sub project of the original and duplicated project 'Sub Project 1'
        original_sub_project = Project.objects.filter(parent_project__id=original_sub_project['pk'])
        duplicated_sub_project = Project.objects.filter(parent_project__id=project_pk)

        # check this sub project
        self.assertEqual(len(duplicated_sub_project), len(original_sub_project),
                         msg="The duplicate project has to have the same count of sub projects than the original "
                             "project")

        self.assertNotEqual(duplicated_sub_project[0].pk, original_sub_project[0].pk,
                            msg="The sub project PK of the duplicated project is not the same as the sub"
                                "project pk of the original project")
        self.assertEqual(duplicated_sub_project[0].name, original_sub_project[0].name,
                         msg="The sub project name of the duplicated project is the same as the sub "
                             "project name of the original project")

    def test_duplicate_project_without_sub_projects(self):
        """ Test for duplicating a project without any sub projects """

        # get the project (Sub Project 2)
        response = self.rest_get_project(self.token1, self.sub_project_2_pk, HTTP_USER_AGENT, REMOTE_ADDR)
        original_project = json.loads(response.content.decode())

        # duplicate project
        response = self.rest_duplicate_project(self.token1, original_project['pk'], HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_200_OK)
        decoded = json.loads(response.content.decode())
        project_pk = decoded['pk']

        # get the sub project of the original and duplicated project 'Sub Project 2'
        original_sub_project = Project.objects.filter(parent_project__id=original_project['pk'])
        duplicated_sub_project = Project.objects.filter(parent_project__id=project_pk)

        # check that no sub projects exist
        self.assertEqual(len(duplicated_sub_project), len(original_sub_project),
                         msg="The duplicate project has to have the same count of sub projects than the original "
                             "project")
        self.assertEqual(len(duplicated_sub_project), 0,
                         msg="The count of sub projects has to be 0.")

    def test_duplicate_project_with_other_users(self):
        """ Tests for duplicating a project with other users. User2 is in the 'User' Group and should be allowed to
        duplicate projects (is allowed to creating projects). User3 is not in the group and should not have this
        permission
        """

        # duplicate main project with user2
        response = self.rest_duplicate_project(self.token2, self.project_pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # duplicate sub project with user2
        response = self.rest_duplicate_project(self.token2, self.sub_project_1_pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # duplicate main project with user3
        response = self.rest_duplicate_project(self.token3, self.project_pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_403_FORBIDDEN,
                          msg="User is not allowed to duplicate (create) a project")

        # duplicate sub project with user3
        response = self.rest_duplicate_project(self.token3, self.sub_project_1_pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_403_FORBIDDEN,
                          msg="User is not allowed to duplicate (create) a project")

    def test_duplicate_trashed_project(self):
        """ Test for duplicating a trashed project. The duplicated project should not be trashed anymore """

        # trash project
        response = self.rest_trash_project(self.token1, self.project_pk, HTTP_USER_AGENT, REMOTE_ADDR)
        decoded = json.loads(response.content.decode())
        self.assertEqual(decoded['deleted'], True,
                         msg="The project should now be trashed")

        # duplicate trashed project
        response = self.rest_duplicate_project(self.token1, self.project_pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_200_OK)
        decoded = json.loads(response.content.decode())
        self.assertEqual(decoded['deleted'], False,
                         msg="A duplicated project should never be trashed either the original project was")

    def test_duplicate_project_with_trashed_sub_project(self):
        """ Test for duplicating project with a sub project which is trashed. The duplicated sub project should not be
        trashed anymore
        """

        # trash project
        response = self.rest_trash_project(self.token1, self.sub_project_1_pk, HTTP_USER_AGENT, REMOTE_ADDR)
        decoded = json.loads(response.content.decode())
        self.assertEqual(decoded['deleted'], True,
                         msg="The sub project should now be trashed")

        # duplicate project with trashed sub project
        response = self.rest_duplicate_project(self.token1, self.project_pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_200_OK)
        decoded = json.loads(response.content.decode())
        project_pk = decoded['pk']

        # check if duplicated sub project is not trashed anymore
        duplicated_sub_projects = Project.objects.filter(parent_project__id=project_pk)

        for duplicated_sub_project in duplicated_sub_projects:
            self.assertEqual(duplicated_sub_project.deleted, False,
                             msg="A duplicated sub project should never be trashed either the original sub project was")
