#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import json

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group

from rest_framework import status
from rest_framework.test import APITestCase

from eric.core.tests import HTTP_INFO
from eric.core.tests.test_utils import CommonTestMixin
from eric.projects.models import Project
from eric.projects.tests.core import AuthenticationMixin, ProjectsMixin

User = get_user_model()

HTTP_USER_AGENT = "APITestClient"
REMOTE_ADDR = "127.0.0.1"


class ProjectsTest(APITestCase, AuthenticationMixin, ProjectsMixin, CommonTestMixin):
    """Extensive testing of project endpoint"""

    # set up users
    def setUp(self):
        """set up a couple of users"""
        # get user group
        self.user_group = Group.objects.get(name="User")

        # create 4 users and assign them to the user group
        self.user1 = User.objects.create_user(username="student_1", email="student_1@email.com", password="top_secret")
        self.user1.groups.add(self.user_group)

        self.user2 = User.objects.create_user(username="student_2", email="student_2@email.com", password="foobar")
        self.user2.groups.add(self.user_group)

        self.user3 = User.objects.create_user(username="student_3", email="student_3@email.com", password="very_secret")
        self.user3.groups.add(self.user_group)

        self.user4 = User.objects.create_user(username="professor", email="pro@fessor.com", password="12345678")
        self.user4.groups.add(self.user_group)

        self.user5 = User.objects.create_user(username="guest", email="guest@guest.com", password="guest")

        self.superuser = User.objects.create_user(
            username="superuser", email="super@user.com", password="sudo", is_superuser=True
        )

        self.student_role = self.create_student_role()

        # 0 projects to begin with
        self.assertEqual(Project.objects.all().count(), 0, msg="There should be zero projects in the database")

        # login some of those users
        self.token1 = self.login_and_return_token("student_1", "top_secret", HTTP_USER_AGENT, REMOTE_ADDR)
        self.token2 = self.login_and_return_token("student_2", "foobar", HTTP_USER_AGENT, REMOTE_ADDR)
        self.token3 = self.login_and_return_token("student_3", "very_secret", HTTP_USER_AGENT, REMOTE_ADDR)
        self.token4 = self.login_and_return_token("professor", "12345678", HTTP_USER_AGENT, REMOTE_ADDR)
        self.token5 = self.login_and_return_token("guest", "guest", HTTP_USER_AGENT, REMOTE_ADDR)
        self.superuser_token = self.login_and_return_token("superuser", "sudo", HTTP_USER_AGENT, REMOTE_ADDR)

        # as those five users logged in, there should be four auto created projects for those users (because one is not
        # in the User group so no project was auto created for him)
        self.assertEqual(Project.objects.all().count(), 4, msg="There should be four projects in the database")

    def test_login_auto_create_project(self):
        """
        Validates that a project is automatically created for users that are in the User Group (after login)
        :return:
        """
        projects1 = self.get_all_projects_from_rest(self.token1, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(
            len(projects1),
            1,
            msg="Validates that the number of projects returned from the REST API is correct for User1",
        )

        projects2 = self.get_all_projects_from_rest(self.token2, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(
            len(projects2),
            1,
            msg="Validates that the number of projects returned from the REST API is correct for User2",
        )

        projects3 = self.get_all_projects_from_rest(self.token3, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(
            len(projects3),
            1,
            msg="Validates that the number of projects returned from the REST API is correct for User3",
        )

        projects4 = self.get_all_projects_from_rest(self.token4, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(
            len(projects4),
            1,
            msg="Validates that the number of projects returned from the REST API is correct for User4",
        )

        # user5 is not in the user group, so it should not have any projects by default
        projects5 = self.get_all_projects_from_rest(self.token5, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(
            len(projects5),
            0,
            msg="Validates that the number of projects returned from the REST API is correct for User5",
        )

        # make sure each of these projects have different primary keys
        self.assertNotEqual(projects1[0]["pk"], projects2[0]["pk"])
        self.assertNotEqual(projects1[0]["pk"], projects3[0]["pk"])
        self.assertNotEqual(projects1[0]["pk"], projects4[0]["pk"])
        self.assertNotEqual(projects2[0]["pk"], projects3[0]["pk"])
        self.assertNotEqual(projects2[0]["pk"], projects4[0]["pk"])
        self.assertNotEqual(projects3[0]["pk"], projects4[0]["pk"])

    def test_create_projects_with_different_users(self):
        """Tries to create projects with all users and checks that the projects have been created in the database"""
        existing_project_count = Project.objects.all().count()

        self.validate_create_project(self.token1)
        self.assertEqual(
            Project.objects.all().count(),
            existing_project_count + 1,
            msg="One additional project should have been created",
        )
        self.validate_number_of_projects_returned_from_rest(self.token1, 1 + 1, HTTP_USER_AGENT, REMOTE_ADDR)
        self.validate_number_of_projects_returned_from_rest(self.token2, 1, HTTP_USER_AGENT, REMOTE_ADDR)
        self.validate_number_of_projects_returned_from_rest(self.token3, 1, HTTP_USER_AGENT, REMOTE_ADDR)
        self.validate_number_of_projects_returned_from_rest(self.token4, 1, HTTP_USER_AGENT, REMOTE_ADDR)

        self.validate_create_project(self.token2)
        self.assertEqual(Project.objects.all().count(), 6)
        self.validate_number_of_projects_returned_from_rest(self.token1, 1 + 1, HTTP_USER_AGENT, REMOTE_ADDR)
        self.validate_number_of_projects_returned_from_rest(self.token2, 1 + 1, HTTP_USER_AGENT, REMOTE_ADDR)
        self.validate_number_of_projects_returned_from_rest(self.token3, 1, HTTP_USER_AGENT, REMOTE_ADDR)
        self.validate_number_of_projects_returned_from_rest(self.token4, 1, HTTP_USER_AGENT, REMOTE_ADDR)

        self.validate_create_project(self.token3)
        self.assertEqual(Project.objects.all().count(), 7)
        self.validate_number_of_projects_returned_from_rest(self.token1, 2, HTTP_USER_AGENT, REMOTE_ADDR)
        self.validate_number_of_projects_returned_from_rest(self.token2, 2, HTTP_USER_AGENT, REMOTE_ADDR)
        self.validate_number_of_projects_returned_from_rest(self.token3, 2, HTTP_USER_AGENT, REMOTE_ADDR)
        self.validate_number_of_projects_returned_from_rest(self.token4, 1, HTTP_USER_AGENT, REMOTE_ADDR)

        self.validate_create_project(self.token4)
        self.assertEqual(Project.objects.all().count(), 8)
        self.validate_number_of_projects_returned_from_rest(self.token1, 2, HTTP_USER_AGENT, REMOTE_ADDR)
        self.validate_number_of_projects_returned_from_rest(self.token2, 2, HTTP_USER_AGENT, REMOTE_ADDR)
        self.validate_number_of_projects_returned_from_rest(self.token3, 2, HTTP_USER_AGENT, REMOTE_ADDR)
        self.validate_number_of_projects_returned_from_rest(self.token4, 2, HTTP_USER_AGENT, REMOTE_ADDR)

    def test_create_project_without_groups(self):
        """
        Try to create a project with user5 which does not have any role (this should fail with 403 Forbidden)
        Basically, for creating a project the user needs to have the global permission "add_project"
        Alternatively, the user should be in the "User" group
        """
        old_project_count = Project.objects.all().count()

        response = self.rest_create_project(
            self.token5, "New Project", "Some Project Description", Project.INITIALIZED, HTTP_USER_AGENT, REMOTE_ADDR
        )

        # project should not have been created, HTTP response code should be 403 forbidden
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        # check that no project has been created
        self.assertEqual(Project.objects.all().count(), old_project_count, msg="No additional project has been created")

    def test_create_project_with_user_group(self):
        """Try to create a project with the user having the group "User" (should work)"""
        # add user to group
        self.user1.groups.add(self.user_group)
        old_project_count = Project.objects.all().count()

        self.client.credentials(HTTP_AUTHORIZATION="Token " + self.token1)

        project = self.create_project(
            self.token1, "New Project", "Some Project Description", Project.INITIALIZED, HTTP_USER_AGENT, REMOTE_ADDR
        )

        self.assertEqual(
            Project.objects.all().count(),
            old_project_count + 1,
            msg="There should be exactly one more project in the database",
        )

        # verify project name and description
        self.assertEqual(project.description, "Some Project Description")
        self.assertEqual(project.name, "New Project")
        self.assertEqual(project.project_state, Project.INITIALIZED)

    def test_edit_project_with_roles(self):
        """Try to edit a project with the wrong user"""
        old_project_count = Project.objects.all().count()

        # add user to group
        self.user1.groups.add(self.user_group)

        # create project
        project = self.create_project(
            self.token1, "Test Project", "Project Description", Project.INITIALIZED, HTTP_USER_AGENT, REMOTE_ADDR
        )

        self.assertEqual(
            Project.objects.all().count(),
            old_project_count + 1,
            msg="There should be exactly one project in the database",
        )

        # verify project name and description
        self.assertEqual(project.description, "Project Description")
        self.assertEqual(project.name, "Test Project")
        self.assertEqual(project.project_state, Project.INITIALIZED)

        # try to edit project
        self.edit_project(
            self.token1,
            project.pk,
            "Test Project Test",
            "Project Description more",
            Project.STARTED,
            HTTP_USER_AGENT,
            REMOTE_ADDR,
        )

        project.refresh_from_db()

        # verify new project name and new project description
        self.assertEqual(project.description, "Project Description more")
        self.assertEqual(project.name, "Test Project Test")
        self.assertEqual(project.project_state, Project.STARTED)

        self.assertEqual(
            Project.objects.all().count(),
            old_project_count + 1,
            msg="There should be exactly one project in the database",
        )

    def test_edit_project_without_roles(self):
        """
        Try to edit a project without roles
        User 1 (token1) creates a project and User 2 (token2) tries to edit it
        However, User 2 is not added to the project, so User 2 is not allowed to even see the project
        """
        old_project_count = Project.objects.count()

        # add user to group
        self.user1.groups.add(self.user_group)

        # create project with user1
        project = self.create_project(
            self.token1, "Test Project", "Project Description", Project.INITIALIZED, HTTP_USER_AGENT, REMOTE_ADDR
        )

        # verify project name and description
        self.assertEqual(project.description, "Project Description")
        self.assertEqual(project.name, "Test Project")
        self.assertEqual(project.project_state, Project.INITIALIZED)

        # try to get project with user2
        response = self.rest_get_project(self.token2, project.pk, HTTP_USER_AGENT, REMOTE_ADDR)

        # this should not work, as the user can not see this project
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

        # try to edit project with user2
        response = self.rest_edit_project(
            self.token2, project.pk, "Test Project Test", "Project Desc", Project.STARTED, HTTP_USER_AGENT, REMOTE_ADDR
        )

        # this should not work, as the user can not see this project
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

        # verify project name and description are still the same
        self.assertEqual(project.description, "Project Description")
        self.assertEqual(project.name, "Test Project")
        self.assertEqual(project.project_state, Project.INITIALIZED)

        self.assertEqual(
            Project.objects.all().count(),
            old_project_count + 1,
            msg="There should be exactly one additional project in the database",
        )

    def test_edit_project_with_wrong_roles(self):
        """
        Try to edit a project with the wrong role
        User 1 (token1) creates a project and adds User 2 (token2) to the project with the "student" role (has
        view_project permission). Therefore User 2 is allowed to view the project, but not to edit the project.
        """
        # add user to group
        self.user1.groups.add(self.user_group)

        # create project with user1
        project = self.create_project(
            self.token1, "Test Project", "Project Description", Project.INITIALIZED, HTTP_USER_AGENT, REMOTE_ADDR
        )

        # verify project name and description
        self.assertEqual(project.description, "Project Description")
        self.assertEqual(project.name, "Test Project")
        self.assertEqual(project.project_state, Project.INITIALIZED)

        # assign user2 to this project as a student
        response = self.rest_assign_user_to_project(
            self.token1, project, self.user2, self.student_role, HTTP_USER_AGENT, REMOTE_ADDR
        )
        # this should work
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # try to get project with user2
        response = self.rest_get_project(self.token2, project.pk, HTTP_USER_AGENT, REMOTE_ADDR)

        # this should work, as the user can see this project (because of student role)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # get assignment with user2 - this should work (because of the student role)
        response = self.rest_get_user_project_assignment(self.token2, project, self.user2, HTTP_USER_AGENT, REMOTE_ADDR)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # try to edit project with user2
        response = self.rest_edit_project(
            self.token2, project.pk, "Test Project Test", "Project Desc", Project.STARTED, HTTP_USER_AGENT, REMOTE_ADDR
        )

        # this should not work, as the user can not see this project
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # verify project name and description are still the same
        self.assertEqual(project.description, "Project Description")
        self.assertEqual(project.name, "Test Project")
        self.assertEqual(project.project_state, Project.INITIALIZED)

    def test_delete_project(self):
        """Tries to delete a project using REST API"""
        pro1 = self.create_project(
            self.token1,
            "My Own Project",
            "Nobody else has access to this project",
            Project.STARTED,
            HTTP_USER_AGENT,
            REMOTE_ADDR,
        )
        # Try to delete this project (should not work, as project needs to be soft deleted first)
        response = self.client.delete(
            f"/api/projects/{pro1.pk}/", HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        # project should still exist
        self.assertEqual(len(Project.objects.not_deleted().filter(pk=pro1.pk)), 1, msg="The project should still exist")

        # Soft delete this project
        response = self.client.patch(
            f"/api/projects/{pro1.pk}/soft_delete/", HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.assertEqual(
            len(Project.objects.not_deleted().filter(pk=pro1.pk)),
            0,
            msg="The project should no longer be in not_deleted",
        )
        self.assertEqual(len(Project.objects.trashed().filter(pk=pro1.pk)), 1, msg="The project should be deleted")

        # really delete this project (must be done by superuser)
        response = self.rest_delete_project(
            self.superuser_token, pro1.pk, HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

        self.assertEqual(
            len(Project.objects.not_deleted().filter(pk=pro1.pk)),
            0,
            msg="The project should no longer be in not_deleted",
        )
        self.assertEqual(len(Project.objects.trashed().filter(pk=pro1.pk)), 0, msg="The project should be deleted")

        # try to delete it again (should not work)
        response = self.rest_delete_project(
            self.superuser_token, pro1.pk, HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_create_without_auth(self):
        """Tries to create a project without being authed"""
        response = self.client.post(
            "/api/projects/",
            {
                "name": "Test project name",
                "description": "test project description",
                "project_state": Project.INITIALIZED,
            },
            HTTP_USER_AGENT="Test API",
            REMOTE_ADDR="127.0.0.1",
        )
        self.assertIn(response.status_code, [status.HTTP_403_FORBIDDEN, status.HTTP_401_UNAUTHORIZED])

    def test_create_with_wrong_parameters(self):
        """Tries to create a project with wrong parameters"""
        # first, login
        self.set_client_credentials(self.token1)

        # do not send a project name
        response = self.client.post(
            "/api/projects/",
            {"description": "test project description", "project_state": Project.INITIALIZED},
            HTTP_USER_AGENT="Test API",
            REMOTE_ADDR="127.0.0.1",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.content.decode(), '{"name":["This field is required."]}')

        # send an empty name
        response = self.client.post(
            "/api/projects/",
            {"name": "", "description": "test project description", "project_state": Project.INITIALIZED},
            HTTP_USER_AGENT="Test API",
            REMOTE_ADDR="127.0.0.1",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.content.decode(), '{"name":["This field may not be blank."]}')

        # do not send a description (allowed)
        response = self.client.post(
            "/api/projects/",
            {"name": "project without description", "project_state": Project.INITIALIZED},
            HTTP_USER_AGENT="Test API",
            REMOTE_ADDR="127.0.0.1",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # send an empty description
        response = self.client.post(
            "/api/projects/",
            {"name": "project without description", "description": "", "project_state": Project.INITIALIZED},
            HTTP_USER_AGENT="Test API",
            REMOTE_ADDR="127.0.0.1",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # send an empty project_state (allowed, should default to INIT)
        response = self.client.post(
            "/api/projects/",
            {"name": "project without description", "description": "", "project_state": ""},
            HTTP_USER_AGENT="Test API",
            REMOTE_ADDR="127.0.0.1",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        decoded = json.loads(response.content.decode())
        self.assertEqual(decoded["project_state"], Project.INITIALIZED)

        # send without project_state (allowed, should default to INIT)
        response = self.client.post(
            "/api/projects/",
            {"name": "project without description", "description": ""},
            HTTP_USER_AGENT="Test API",
            REMOTE_ADDR="127.0.0.1",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        decoded = json.loads(response.content.decode())
        self.assertEqual(decoded["project_state"], Project.INITIALIZED)

    def test_get_without_auth(self):
        """Tries to do various things with the projects endpoint without being authenticated"""
        # no auth
        self.reset_client_credentials()
        response = self.client.get("/api/projects/")
        self.assertIn(response.status_code, [status.HTTP_403_FORBIDDEN, status.HTTP_401_UNAUTHORIZED])
        response = self.client.post("/api/projects/")
        self.assertIn(response.status_code, [status.HTTP_403_FORBIDDEN, status.HTTP_401_UNAUTHORIZED])

        # wrong auth
        self.set_client_credentials("this-is-not-a-valid-token")
        response = self.client.get("/api/projects/")

        self.assertIn(response.status_code, [status.HTTP_403_FORBIDDEN, status.HTTP_401_UNAUTHORIZED])
        self.assertEqual(response.content.decode(), '{"detail":"Invalid token."}')

        response = self.client.post("/api/projects/")
        self.assertIn(response.status_code, [status.HTTP_403_FORBIDDEN, status.HTTP_401_UNAUTHORIZED])
        self.assertEqual(response.content.decode(), '{"detail":"Invalid token."}')

        # again wrong auth
        self.set_client_credentials("this-is-yet-another-invalid-token")
        response = self.client.get("/api/projects/")
        self.assertIn(response.status_code, [status.HTTP_403_FORBIDDEN, status.HTTP_401_UNAUTHORIZED])
        self.assertEqual(response.content.decode(), '{"detail":"Invalid token."}')

        response = self.client.post("/api/projects/")
        self.assertIn(response.status_code, [status.HTTP_403_FORBIDDEN, status.HTTP_401_UNAUTHORIZED])
        self.assertEqual(response.content.decode(), '{"detail":"Invalid token."}')

        # now try a token which has an invalid format (spaces)
        self.set_client_credentials("this is a token with spaces")
        response = self.client.get("/api/projects/")
        self.assertIn(response.status_code, [status.HTTP_403_FORBIDDEN, status.HTTP_401_UNAUTHORIZED])
        self.assertEqual(
            response.content.decode(), '{"detail":"Invalid token header. Token string should not contain spaces."}'
        )

        response = self.client.post("/api/projects/")
        self.assertIn(response.status_code, [status.HTTP_403_FORBIDDEN, status.HTTP_401_UNAUTHORIZED])
        self.assertEqual(
            response.content.decode(), '{"detail":"Invalid token header. Token string should not contain spaces."}'
        )

    def test_get_projects_with_wrong_user(self):
        """
        Tries to get projects of other users
        Basically this test verifies that the knowledge of a project primary key does not lead to retrieving further
        project information
        :return:
        """
        pro1 = self.create_project(
            self.token1,
            "My Own Project",
            "Nobody else has access to this project",
            Project.STARTED,
            HTTP_USER_AGENT,
            REMOTE_ADDR,
        )
        pro2 = self.create_project(
            self.token2,
            "Other Users Project",
            "Nobody else has access to this project",
            Project.INITIALIZED,
            HTTP_USER_AGENT,
            REMOTE_ADDR,
        )

        # user1 can get this project pro1
        response = self.rest_get_project(self.token1, pro1.pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # but user2 can not get this project pro1
        response = self.rest_get_project(self.token2, pro1.pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

        # but user2 can access its own project pro2
        response = self.rest_get_project(self.token2, pro2.pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # user2 can also access pro1 and pro2
        response = self.rest_get_project(self.token3, pro1.pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

        response = self.rest_get_project(self.token3, pro2.pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

        # No user can query anything with a wrong primary key (which will either be a not found or a validation error in django 1.11)
        self.set_client_credentials(self.token1)
        response = self.client.get("/api/projects/1337/")
        self.assertIn(response.status_code, [status.HTTP_400_BAD_REQUEST, status.HTTP_404_NOT_FOUND])

        # No user can query anything with a wrong primary key (which will either be a not found or a validation error in django 1.11)
        self.set_client_credentials(self.token2)
        response = self.client.get("/api/projects/1337/")
        self.assertIn(response.status_code, [status.HTTP_400_BAD_REQUEST, status.HTTP_404_NOT_FOUND])

    def test_project_tree_attribute(self):
        self.create_project(self.token1, "A", "desc", Project.STARTED, *HTTP_INFO)
        prj_B = self.create_project(self.token1, "B", "desc", Project.STARTED, *HTTP_INFO)
        prj_B1 = self.create_project(self.token1, "B1", "desc", Project.STARTED, *HTTP_INFO)
        prj_B2 = self.create_project(self.token1, "B2", "desc", Project.STARTED, *HTTP_INFO)
        prj_B2x = self.create_project(self.token1, "B2x", "desc", Project.STARTED, *HTTP_INFO)
        self.create_project(self.token1, "C", "desc", Project.STARTED, *HTTP_INFO)

        self.rest_set_parent_project(self.token1, prj_B1, prj_B)
        self.rest_set_parent_project(self.token1, prj_B2, prj_B)
        self.rest_set_parent_project(self.token1, prj_B2x, prj_B2)

        # check project tree of project B
        response = self.rest_get_project(self.token1, prj_B.pk, **HTTP_INFO)
        project_from_api = self.parse_response(response)
        project_tree = project_from_api["project_tree"]
        self.assertEqual(len(project_tree), 4)
        project_names_in_tree = {p["name"] for p in project_tree}
        self.assertEqual(project_names_in_tree.difference({"B", "B1", "B2", "B2x"}), set())
