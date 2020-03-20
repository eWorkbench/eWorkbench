#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import json
from django.core.exceptions import ValidationError
from django.contrib.auth.models import Group
from django.contrib.auth import get_user_model
from django.utils.translation import ugettext_lazy as _

User = get_user_model()

from rest_framework.test import APITestCase
from rest_framework import status
from eric.projects.models import Project, ProjectRoleUserAssignment, Role

from eric.projects.tests.core import AuthenticationMixin, ProjectsMixin

# read http://www.django-rest-framework.org/api-guide/testing/ for more info about testing with django rest framework

HTTP_USER_AGENT = "APITestClient"
REMOTE_ADDR = "127.0.0.1"


class ProjectsParentProjectTest(APITestCase, AuthenticationMixin, ProjectsMixin):
    """ Testing setting the parent project """

    # set up users
    def setUp(self):
        self.user_group = Group.objects.get(name='User')

        """ set up a couple of users, a student role and a project manager role """
        self.user1 = User.objects.create_user(
            username='student_1', email='student_1@email.com', password='top_secret')
        self.user1.groups.add(self.user_group)

        self.user2 = User.objects.create_user(
            username='student_2', email='student_2@email.com', password='foobar')
        self.user2.groups.add(self.user_group)

        self.token1 = self.login_and_return_token('student_1', 'top_secret')
        self.token2 = self.login_and_return_token('student_2', 'foobar')

        self.student_role = self.create_student_role()
        self.observer_role = Role.objects.filter(name="Observer").first()
        self.pm_role = Role.objects.filter(default_role_on_project_create=True).first()

    def test_set_parent_project_to_access_another_project(self):
        """ Tests changing the parent project """
        # create project with student1
        student1_project1 = self.create_project(self.token1, "Master of student1", "Project Description", "INIT",
                                      HTTP_USER_AGENT, REMOTE_ADDR)

        student1_project2 = self.create_project(self.token1, "Slave of student1", "Project Description", "INIT",
                                                HTTP_USER_AGENT, REMOTE_ADDR)

        # relate project2 to project1
        response = self.rest_set_parent_project(self.token1, student1_project2, student1_project1)
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # create project with student2
        student2_project1 = self.create_project(self.token2, "Master of student2", "Project Description", "INIT",
                                                HTTP_USER_AGENT, REMOTE_ADDR)

        student2_project2 = self.create_project(self.token2, "Slave of student2", "Project Description", "INIT",
                                                HTTP_USER_AGENT, REMOTE_ADDR)

        # relate project2 to project1
        response = self.rest_set_parent_project(self.token2, student2_project2, student2_project1)
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # try to relate student2_project1 to student1_project2 (no access)
        response = self.rest_set_parent_project(self.token2, student2_project1, student1_project2)
        self.assertIn(response.status_code, [status.HTTP_400_BAD_REQUEST, status.HTTP_404_NOT_FOUND])
        decoded_response = json.loads(response.content.decode())
        self.assertTrue("parent_project" in decoded_response)
        self.assertEquals(decoded_response["parent_project"][0], _("You are not allowed to select this project"))

        # now add student2 to student1_project2 as an observer
        response = self.rest_assign_user_to_project(self.token1, student1_project2, self.user2, self.observer_role,
                                                    HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_201_CREATED)

        # now student2 can try to query the project
        response = self.rest_get_project(self.token2, student1_project2.pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # but student2 should still not be able to relate student2_project1 to student1_project2, as this requires
        # the add_project permission within student1_project2
        response = self.rest_set_parent_project(self.token2, student2_project1, student1_project2)
        self.assertIn(response.status_code, [status.HTTP_400_BAD_REQUEST, status.HTTP_404_NOT_FOUND])
        decoded_response = json.loads(response.content.decode())
        self.assertTrue("parent_project" in decoded_response)
        self.assertEquals(decoded_response["parent_project"][0], _("You are not allowed to select this project"))

    def test_create_project_circular_references(self):
        """ Tries to create multiple projects and create a circular reference via REST (which is not allowed) """
        # create master project
        project_master = self.validate_create_project(self.token1)

        # set parent project
        response = self.rest_set_parent_project(self.token1, project_master, project_master)
        # should fail
        self.assertContains(response, "Circular reference detected", status_code=status.HTTP_400_BAD_REQUEST)

        # create slave project
        project_slave = self.validate_create_project(self.token1)

        # set parent project
        response = self.rest_set_parent_project(self.token1, project_slave, project_master)
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # create another slave project
        project_slave2 = self.validate_create_project(self.token1)

        # set parent project
        response = self.rest_set_parent_project(self.token1, project_slave2, project_slave)
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # now edit project_master and set its parent to project_slave2, which should create a circular reference
        response = self.rest_set_parent_project(self.token1, project_master, project_slave2)
        # should fail
        self.assertContains(response, "Circular reference detected", status_code=status.HTTP_400_BAD_REQUEST)

    def test_change_project_parent_project_with_wrong_user(self):
        """
        Creates a project and tries to change the parent project with another user
        :return:
        """
        # create master project (created by student 1)
        master_project1 = self.validate_create_project(self.token1, 'Master of Student 1')
        self.validate_number_of_projects_returned_from_rest(self.token1, 1 + 1, HTTP_USER_AGENT, REMOTE_ADDR)

        # create master project (created by student_2)
        master_project2 = self.validate_create_project(self.token2, 'Master of Student 2')
        self.validate_number_of_projects_returned_from_rest(self.token2, 1 + 1, HTTP_USER_AGENT, REMOTE_ADDR)
        # verify that master_project2 does not have a parent project
        self.assertEquals(master_project2.parent_project, None,
                          msg="Verify that master_project2 does not have a parent project initially")

        # student_1 should still only have access to two projects
        self.validate_number_of_projects_returned_from_rest(self.token1, 1 + 1, HTTP_USER_AGENT, REMOTE_ADDR)

        # assign student 1 to the project of student 2
        self.validate_assign_user_to_project(self.token2, master_project2,
                                             self.user1, self.student_role, HTTP_USER_AGENT, REMOTE_ADDR)

        # student_1 should now gain access to another project (2+1 in total)
        self.validate_number_of_projects_returned_from_rest(self.token1, 2 + 1, HTTP_USER_AGENT, REMOTE_ADDR)

        # try changing the parent project of master_project2 with student_1 (should fail, as student_1 is not allowed
        # to do this)
        response = self.rest_set_parent_project(self.token1, master_project2, master_project1)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        # verify that master_project2 still does not have a parent project
        master_project2.refresh_from_db()
        self.assertEquals(master_project2.parent_project, None,
                          msg="Verify master project of student 2 does not have a parent project")

    def test_create_projects_with_sub_projects_validate_access(self):
        """
        Creates 2 projects for student_1, and 1 project for student_2, and tries to set parent project so that
        student_1 gets access to the project of student_2
        :return:
        """
        # Student 1 creates master project
        master_project = self.validate_create_project(self.token1, "Master of Student 1")
        # Student 1 should have two projects (auto created "My Project" and "Master of Student 1")
        self.validate_number_of_projects_returned_from_rest(self.token1, 2, HTTP_USER_AGENT, REMOTE_ADDR)

        # Student 1 creates slave project and sets the parent to master
        slave_project = self.validate_create_project(self.token1, "Slave of Student 1")
        # Student 1 should have 3 projects (auto created "My Project" + "Master of Student 1" + "Slave of Student 1")
        self.validate_number_of_projects_returned_from_rest(self.token1, 3, HTTP_USER_AGENT, REMOTE_ADDR)

        # make master the "parent" of slave
        response = self.rest_set_parent_project(self.token1, slave_project, master_project)
        self.assertEquals(response.status_code, status.HTTP_200_OK)
        # should still be three projects
        self.validate_number_of_projects_returned_from_rest(self.token1, 3, HTTP_USER_AGENT, REMOTE_ADDR)

        # in the meantime, student 2 should only have his own project (auto created "My Project" for Student 1)
        self.validate_number_of_projects_returned_from_rest(self.token2, 1, HTTP_USER_AGENT, REMOTE_ADDR)

        # now student_2 is going to create another project
        another_project = self.validate_create_project(self.token2, 'Another Project of Student 2')
        # student 2 should have access to two projects
        self.validate_number_of_projects_returned_from_rest(self.token2, 2, HTTP_USER_AGENT, REMOTE_ADDR)
        # while student 1 still has three projects
        self.validate_number_of_projects_returned_from_rest(self.token1, 3, HTTP_USER_AGENT, REMOTE_ADDR)

        # student 2 is going to try to set the master of this project to master_project, which should not work, as
        # student 2 is not allowed to see master project
        response = self.rest_set_parent_project(self.token2, another_project, master_project)
        self.assertIn(response.status_code, [status.HTTP_400_BAD_REQUEST, status.HTTP_403_FORBIDDEN])

        # the number of projects seen by each should still be the same
        self.validate_number_of_projects_returned_from_rest(self.token2, 2, HTTP_USER_AGENT, REMOTE_ADDR)
        self.validate_number_of_projects_returned_from_rest(self.token1, 3, HTTP_USER_AGENT, REMOTE_ADDR)

        # similarly, student 1 is not allowed to set the parent project to "Another Project of Student 2"
        response = self.rest_set_parent_project(self.token1, master_project, another_project)
        self.assertIn(response.status_code, [status.HTTP_400_BAD_REQUEST, status.HTTP_403_FORBIDDEN])

        # the number of projects seen by each should still be the same
        self.validate_number_of_projects_returned_from_rest(self.token2, 2, HTTP_USER_AGENT, REMOTE_ADDR)
        self.validate_number_of_projects_returned_from_rest(self.token1, 3, HTTP_USER_AGENT, REMOTE_ADDR)

