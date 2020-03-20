#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import json
from django.core.exceptions import ValidationError
from django.contrib.auth.models import Group
from django.contrib.auth import get_user_model
User = get_user_model()

from rest_framework.test import APITestCase
from rest_framework import status
from eric.projects.models import Project, ProjectRoleUserAssignment, Role

from eric.projects.tests.core import AuthenticationMixin, ProjectsMixin

# read http://www.django-rest-framework.org/api-guide/testing/ for more info about testing with django rest framework

HTTP_USER_AGENT = "APITestClient"
REMOTE_ADDR = "127.0.0.1"


class ProjectsUserAssignmentTest(APITestCase, AuthenticationMixin, ProjectsMixin):
    """ Testing of permissions of the /api/projects/:pk/assignments endpoint for assigning team members """

    # set up users
    def setUp(self):
        """ set up a couple of users, a student role and a project manager role """
        self.user1 = User.objects.create_user(
            username='student_1', email='student_1@email.com', password='top_secret')
        self.token1 = self.login_and_return_token('student_1', 'top_secret')

        self.user2 = User.objects.create_user(
            username='student_2', email='student_2@email.com', password='foobar')
        self.token2 = self.login_and_return_token('student_2', 'foobar')

        self.student_role = self.create_student_role()

        self.observer_role = Role.objects.filter(name="Observer").first()

        self.pm_role = Role.objects.filter(default_role_on_project_create=True).first()

        self.user_group = Group.objects.get(name='User')

    def test_crud_project_user_assignments(self):
        """ Tests creating and retrieving project user assignments """
        # add user to group
        self.user1.groups.add(self.user_group)

        # create project with user1
        project = self.create_project(self.token1, "Test Project", "Project Description", "INIT",
                                      HTTP_USER_AGENT, REMOTE_ADDR)
        # get assignments for this project (should work)
        response = self.rest_get_user_project_assignments(self.token1, project, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # check the response
        decoded = json.loads(response.content.decode())
        # should contain exactly one assignment
        self.assertEqual(len(decoded), 1)
        # the assignment should contain project, role and user
        self.assertTrue('project' in decoded[0])
        self.assertTrue('role' in decoded[0])
        self.assertTrue('user' in decoded[0])
        # and they should match project.pk, user1.pk and pm_role.pk
        self.assertEqual(decoded[0]['project'], str(project.pk))
        self.assertEqual(decoded[0]['user']['pk'], self.user1.pk)
        self.assertEqual(decoded[0]['role']['pk'], str(self.pm_role.pk))

        # assign user2 to this project as a student
        response = self.rest_assign_user_to_project(self.token1, project, self.user2, self.student_role,
                                                    HTTP_USER_AGENT, REMOTE_ADDR)
        # this should work
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # retrieve updated list of assignments (should work)
        response = self.rest_get_user_project_assignments(self.token1, project, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # check the response
        decoded = json.loads(response.content.decode())
        # should contain exactly two assignment
        self.assertEqual(len(decoded), 2)

        # the first one should not have changed
        self.assertEqual(decoded[0]['project'], str(project.pk))
        self.assertEqual(decoded[0]['user']['pk'], self.user1.pk)
        self.assertEqual(decoded[0]['role']['pk'], str(self.pm_role.pk))

        # the second one should be for the user2
        self.assertEqual(decoded[1]['project'], str(project.pk))
        self.assertEqual(decoded[1]['user']['pk'], self.user2.pk)
        self.assertEqual(decoded[1]['role']['pk'], str(self.student_role.pk))

        # Try to remove user1 (project manager), which should fail
        response = self.rest_delete_user_from_project(self.token1, project.pk, decoded[0]['pk'], HTTP_USER_AGENT,
                                                      REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        # check the response
        decoded_last_pm = json.loads(response.content.decode())
        self.assertTrue('last project manager' in str(decoded_last_pm['non_field_errors']))
        self.assertTrue('can not' in str(decoded_last_pm['non_field_errors']))

        # try to update user1 (project manager) to student, which should fail
        response = self.rest_edit_user_project_assignment(self.token1, project, decoded[0]['pk'], self.user1,
                                                          self.student_role, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        # Try to remove user2 (student), which should work
        response = self.rest_delete_user_from_project(self.token1, project.pk, decoded[1]['pk'],
                                                      HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_edit_project_user_assignments_twice(self):
        """ Try to edit a project with the wrong role """
        # add user to group
        self.user1.groups.add(self.user_group)

        # create project with user1
        project = self.create_project(self.token1, "Test Project", "Project Description", "INIT",
                                      HTTP_USER_AGENT, REMOTE_ADDR)

        # assign user2 to this project as a student (should work)
        response = self.rest_assign_user_to_project(self.token1, project, self.user2, self.student_role,
                                         HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # try to do the same thing again, which should not work as the pair (user,project) is unique
        response = self.rest_assign_user_to_project(self.token1, project, self.user2, self.student_role,
                                                    HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        # choose a different role for user2, which should also not work, as (user,project) is unique
        response = self.rest_assign_user_to_project(self.token1, project, self.user2, self.pm_role,
                                                    HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_crud_project_user_assignments_change_project_manager(self):
        """ Tests creating and retrieving project user assignments """
        # add user to group
        self.user1.groups.add(self.user_group)

        # create project with user1
        project = self.create_project(self.token1, "Test Project", "Project Description", "INIT",
                                      HTTP_USER_AGENT, REMOTE_ADDR)
        # get assignments for this project (should work)
        response = self.rest_get_user_project_assignments(self.token1, project, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # check the response
        decoded = json.loads(response.content.decode())
        # should contain exactly one assignment
        self.assertEqual(len(decoded), 1)

        # assign user2 to this project as an observer (should work)
        response = self.rest_assign_user_to_project(self.token1, project, self.user2, self.observer_role,
                                                    HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # retrieve updated list of assignments (should work)
        response = self.rest_get_user_project_assignments(self.token1, project, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # check the response
        decoded = json.loads(response.content.decode())
        # should contain exactly two assignment
        self.assertEqual(len(decoded), 2)

        # the first one should not have changed
        self.assertEqual(decoded[0]['project'], str(project.pk))
        self.assertEqual(decoded[0]['user']['pk'], self.user1.pk)
        self.assertEqual(decoded[0]['role']['pk'], str(self.pm_role.pk))

        # the second one should be for the user2
        self.assertEqual(decoded[1]['project'], str(project.pk))
        self.assertEqual(decoded[1]['user']['pk'], self.user2.pk)
        self.assertEqual(decoded[1]['role']['pk'], str(self.observer_role.pk))

        # user2 should be able to view user project assignments
        response = self.rest_get_user_project_assignments(self.token2, project, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(json.loads(response.content.decode())), 2,
                         msg="There should be two users in the assignment")

        # now user2 tries to increase his own roles to project manager (should not work)
        response = self.rest_edit_user_project_assignment(self.token2, project, decoded[1]['pk'], self.user2,
                                                          self.pm_role,
                                                          HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertIn(response.status_code, [status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND])

        # user2 tries to remove user1 from PM (should not work)
        response = self.rest_edit_user_project_assignment(self.token2, project, decoded[0]['pk'], self.user1,
                                                          self.observer_role,
                                                          HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertIn(response.status_code, [status.HTTP_400_BAD_REQUEST, status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND])

        # Give user2 the project manager permission (should work)
        response = self.rest_edit_user_project_assignment(self.token1, project, decoded[1]['pk'], self.user2, self.pm_role,
                                               HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Now user2 can remove user1 (the first project manager), which should work
        response = self.rest_delete_user_from_project(self.token2, project.pk, decoded[0]['pk'], HTTP_USER_AGENT,
                                                      REMOTE_ADDR)
        # this should work
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

        # now there should only be one entry left in the project assignment
        response = self.rest_get_user_project_assignments(self.token2, project, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(json.loads(response.content.decode())), 1,
                         msg="There should only be one user in the assignment")

        # and user1 should not have access to the assignments any more
        response = self.rest_get_user_project_assignments(self.token1, project, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertIn(response.status_code, [status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND])
