#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import json

from rest_framework import status
from rest_framework.test import APITestCase

from eric.core.tests import HTTP_USER_AGENT, REMOTE_ADDR
from eric.core.tests.test_utils import CommonTestMixin
from eric.favourites.models import Favourite
from eric.favourites.tests.core import FavouritesMixin
from eric.projects.models import Project, Role
from eric.projects.tests.core import AuthenticationMixin, ProjectsMixin


class FavouritesTest(APITestCase, CommonTestMixin, AuthenticationMixin, ProjectsMixin, FavouritesMixin):
    def setUp(self):
        # create 2 users and assign them to the user group
        self.user1, self.token1 = self.create_user_and_log_in(groups=["User"], username="student_1")
        self.user2, self.token2 = self.create_user_and_log_in(groups=["User"], username="student_2")
        self.superuser, self.superuser_token = self.create_user_and_log_in(username="superuser", is_superuser=True)

        # create two new projects
        self.project1 = self.create_project(
            self.token1, "DMP Project", "Unittest DMP Project", Project.INITIALIZED, HTTP_USER_AGENT, REMOTE_ADDR
        )

        self.project2 = self.create_project(
            self.token1, "DMP Project", "Unittest DMP Project", Project.INITIALIZED, HTTP_USER_AGENT, REMOTE_ADDR
        )

        # get project manager role
        self.projectManagerRole = Role.objects.filter(default_role_on_project_create=True).first()
        self.observerRole = Role.objects.filter(name="Observer").first()

        # add user2 to project1 as observer
        self.rest_assign_user_to_project(
            self.token1, self.project1, self.user2, self.observerRole, HTTP_USER_AGENT, REMOTE_ADDR
        )

    def test_create_favourite(self):
        """Tries to create favourites and verifies that the favourite was created"""
        # mark project1 as favourite for user1
        self.rest_create_project_favourite(self.token1, self.project1.pk)

        # there should be exactly one favourite in projects
        response = self.rest_get_favourite_projects(self.token1)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # decode the favourites for this project
        decoded_response = json.loads(response.content.decode())
        # should be one favourite
        self.assertEqual(
            len(decoded_response["results"]), 1, msg="There should be exactly one favourite for this project"
        )
        self.assertEqual(decoded_response["results"][0]["pk"], str(self.project1.pk))

        # mark project2 as favourite
        self.rest_create_project_favourite(self.token1, self.project2.pk)

        # get all favourites for projects
        response = self.rest_get_favourite_projects(self.token1)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # decode the favourites for projects
        decoded_response = json.loads(response.content.decode())
        # should be two favourites
        self.assertEqual(len(decoded_response["results"]), 2, msg="There should be exactly two favourites for projects")
        self.assertEqual(Favourite.objects.all().count(), 2, msg="There should be exactly two favourites")

    def test_create_favourite_and_verify_response(self):
        """
        Tries to create a project favourite and verifies the response-details
        """
        self.client.credentials(HTTP_AUTHORIZATION="Token " + self.token1)

        # store the favourite length
        initial_favourite_length = Favourite.objects.all().count()
        content_type = Project.get_content_type()

        # create favourite via REST API
        response = self.rest_create_project_favourite(self.token1, self.project1.pk)

        # favourite should have been created, HTTP response code should be 201
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # decode response and load it into json
        content = response.content.decode()
        decoded_response = json.loads(content)

        self.assertTrue('"pk":' in content, msg="primary key (pk) in response")
        self.assertTrue(f'"content_type":{content_type.pk}' in content, msg="correct content_type in response")
        self.assertTrue(f'"object_id":"{self.project1.pk}"' in content, msg="correct object_id in response")

        # see what the actual Favourite element from database looks like
        pk = decoded_response["pk"]
        # get the favourite object from database
        favourite = Favourite.objects.get(pk=pk)

        # check if the favourite object was created
        self.assertEqual(
            Favourite.objects.all().count(), initial_favourite_length + 1, msg="check if the favourite was created"
        )

        # verify several favourite attributes with api response
        self.assertEqual(str(favourite.pk), decoded_response["pk"])
        self.assertEqual(str(favourite.object_id), decoded_response["object_id"])

        # check if the correct content_type, object_id were saved
        self.assertEqual(favourite.content_type, content_type, msg="check if correct content_type was saved")
        self.assertEqual(favourite.object_id, self.project1.pk, msg="check if correct object_id was saved")

        return response

    def test_favourites_can_not_be_created_if_not_viewable_by_user(self):
        """
        Tries to create favourites for a object that is not viewable by the current user (which should fail)
        :return:
        """

        # verify that user2 has no access to project2
        response = self.rest_get_project(self.token2, self.project2.pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

        # verify that user2 can not favourite project2 (should not have access to project2 -> 403)
        response = self.rest_create_favourite(self.token2, self.project2.pk, Project.get_content_type().pk)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # verify that user1 has access to project2
        response = self.rest_get_project(self.token1, self.project2.pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # verify that user1 can favourite project2 (should have access to project2 -> 201)
        response = self.rest_create_project_favourite(self.token1, self.project2.pk)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # finally, there should have been one favourite created
        self.assertEqual(Favourite.objects.all().count(), 1, msg="There should be one favourite")

    def test_delete_favourites(self):
        """tries to delete a favourite"""
        # verify that user1 has access to project1
        response = self.rest_get_project(self.token1, self.project1.pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # mark project1 as favourite of user1
        favourite_response = self.rest_create_project_favourite(self.token1, self.project1.pk)

        # try to get the new favourite with student1
        response = self.rest_get_favourite(self.token1, favourite_response.data["pk"])
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # delete favourite with student 1 (allowed)
        response = self.rest_delete_favourite(self.token1, self.project1.pk, Project.get_content_type())
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

        # try to get the just deleted favourite with student1 (does not work obviously)
        response = self.rest_get_favourite(self.token1, favourite_response.data["pk"])
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

        # mark project1 as favourite for user1
        favourite_response = self.rest_create_project_favourite(self.token1, self.project1.pk)

        # try to get favourite with student 2 (doesn't work)
        response = self.rest_get_favourite(self.token2, favourite_response.data["pk"])
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

        # delete favourite with student 2 (not allowed)
        response = self.rest_delete_favourite(self.token2, self.project1.pk, Project.get_content_type())
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

        # verify the favourite still exists
        response = self.rest_get_favourite(self.token1, favourite_response.data["pk"])
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_delete_object_should_also_delete_favourite(self):
        """
        Tests that deleting an object with favourites should also delete the favourites
        :return:
        """
        # verify that user1 has access to project1
        response = self.rest_get_project(self.token1, self.project1.pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # mark project1 as favourite for user1
        favourite_response = self.rest_create_project_favourite(self.token1, self.project1.pk)

        # try to get the new favourite with student1
        response = self.rest_get_favourite(self.token1, favourite_response.data["pk"])
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # now user1 trashes project1
        response = self.rest_trash_project(self.token1, self.project1.pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # superuser deletes project1
        response = self.rest_delete_project(self.superuser_token, self.project1.pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

        # this should lead to favourite1 also being deleted
        self.assertFalse(Favourite.objects.filter(pk=favourite_response.data["pk"]).exists())


class FavouriteFilterTest(APITestCase, CommonTestMixin, AuthenticationMixin, ProjectsMixin, FavouritesMixin):
    def setUp(self):
        self.user, self.token = self.create_user_and_log_in(username="superuser", is_superuser=True)
        # Hint: A project is automatically created for every new user

        self.project1 = self.create_project(
            self.token, "Project 1", "Description", Project.INITIALIZED, HTTP_USER_AGENT, REMOTE_ADDR
        )

        self.project2 = self.create_project(
            self.token, "Project 2", "Description", Project.INITIALIZED, HTTP_USER_AGENT, REMOTE_ADDR
        )

        self.fav_project1 = self.create_project(
            self.token, "Fav Project 1", "Description", Project.INITIALIZED, HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.rest_create_project_favourite(self.token, self.fav_project1.pk)

    def test_favourite_filter_empty(self):
        """Tests that an empty filter value does not filter the queryset"""

        response = self.rest_get_projects_with_favourite_param(self.token, favourite="")
        json_response = self.parse_response(response)
        self.assertEqual(4, json_response["count"])

    def test_favourite_filter_true(self):
        """Should return favourited elements only"""

        response = self.rest_get_projects_with_favourite_param(self.token, favourite="true")
        json_response = self.parse_response(response)
        self.assertEqual(1, json_response["count"])
        projects = json_response["results"]
        self.assertEqual(self.fav_project1.name, projects[0]["name"])

    def test_favourite_filter_false(self):
        """Should return non-favourited elements only"""

        response = self.rest_get_projects_with_favourite_param(self.token, favourite="false")
        json_response = self.parse_response(response)
        self.assertEqual(3, json_response["count"])

        response_projects = json_response["results"]
        response_project_names = {entry["name"] for entry in response_projects}
        self.assertNotIn(self.fav_project1.name, response_project_names)
