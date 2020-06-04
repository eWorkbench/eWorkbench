#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import json

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from rest_framework import status
from rest_framework.test import APITestCase

from eric.projects.models import Project
from eric.projects.tests.core import AuthenticationMixin, ProjectsMixin, MeMixin
from eric.shared_elements.tests.core import FileMixin

User = get_user_model()

HTTP_USER_AGENT = "APITestClient"
REMOTE_ADDR = "127.0.0.1"

KB_factor = 1024
MB_factor = KB_factor * 1024


class UserStorageLimitTest(APITestCase, AuthenticationMixin, ProjectsMixin, FileMixin, MeMixin):
    """Testing of user storage limit logic"""

    def setUp(self):
        """set up basic data"""

        # get user group
        self.user_group = Group.objects.get(name='User')

        # create users
        self.user1 = User.objects.create_user(
            username="student_1", email="student_1@email.com", password="top_secret")
        self.user1.groups.add(self.user_group)

        self.user2 = User.objects.create_user(
            username="student_2", email="student_2@email.com", password="top_secret")
        self.user2.groups.add(self.user_group)

        self.superuser = User.objects.create_user(
            username="superuser", email="super@user.com", password="sudo", is_superuser=True
        )

        # login
        self.token1 = self.login_and_return_token("student_1", "top_secret", HTTP_USER_AGENT, REMOTE_ADDR)
        self.token2 = self.login_and_return_token("student_2", "top_secret", HTTP_USER_AGENT, REMOTE_ADDR)
        self.superuser_token = self.login_and_return_token("superuser", "sudo", HTTP_USER_AGENT, REMOTE_ADDR)

        # create a new project
        self.project = self.create_project(self.token1, "New Project", "User storage limit test", Project.INITIALIZED,
                                           HTTP_USER_AGENT, REMOTE_ADDR)

    def test_user_storage_limit_fields(self):
        """checks if each created users has automatically a storage limit of 100 MB"""

        response = self.rest_get_me(self.token1)
        decoded = json.loads(response.content.decode())

        # check if the user storage limit was set correct
        self.assertEquals(decoded['available_storage_megabyte'], 100,
                          msg="The limit of user storage limit should be 100 MB")

        # check if the used storage is correct
        self.assertEquals(decoded['used_storage_megabyte'], 0,
                          msg="The used storage is 0 because no files where uploaded yet")

    def test_calculate_used_storage(self):
        """checks if the used storage is calculated correct"""
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + self.token1)

        # create a file with 50263000 bytes (50,263 MB)
        file1 = self.rest_create_file(self.token1, self.project.pk, 'Test Title', 'Test Description',
                                      'somefile.txt', 50263000, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(file1.status_code, status.HTTP_201_CREATED)

        # check if the used storage is correct
        response = self.rest_get_me(self.token1)
        decoded = json.loads(response.content.decode())
        self.assertEquals(decoded['used_storage_megabyte'] * MB_factor, 50263000,
                          msg="The used storage is now 50.263")

        # create a file with 115000 bytes (115 KB)
        file2 = self.rest_create_file(self.token1, self.project.pk, 'Test Title', 'Test Description',
                                      'somefile.txt', 115000, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(file2.status_code, status.HTTP_201_CREATED)

        # check if the used storage is correct
        response = self.rest_get_me(self.token1)
        decoded = json.loads(response.content.decode())
        self.assertEquals(decoded['used_storage_megabyte'] * MB_factor, 115000 + 50263000,
                          msg="The used storage is now 50.378")

        # add a file entry with 8900000 (8.9 MB)
        response = self.rest_update_file(self.token1, file2.data['pk'], self.project.pk, 'Test Title',
                                         'Test Description',
                                         'yetanother.txt', 8900000, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # check if the used storage is correct
        response = self.rest_get_me(self.token1)
        decoded = json.loads(response.content.decode())
        self.assertEquals(decoded['used_storage_megabyte'] * MB_factor, 115000 + 50263000 + 8900000,
                          msg="The used storage is now 59.278")

        # trash file with 115000 bytes (115 KB)
        response = self.rest_trash_file(self.token1, file2.data['pk'], HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # check that the used storage is the same as before
        response = self.rest_get_me(self.token1)
        decoded = json.loads(response.content.decode())
        self.assertEquals(decoded['used_storage_megabyte'] * MB_factor, 115000 + 50263000 + 8900000,
                          msg="The used storage is now 59.278")

        # delete file with 115000 bytes (115 KB) plus the file entry with with 8900000 (8.9 MB)
        response = self.rest_delete_file(self.superuser_token, file2.data['pk'], HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_204_NO_CONTENT)

        # check if the used storage is correct
        response = self.rest_get_me(self.token1)
        decoded = json.loads(response.content.decode())
        self.assertEquals(decoded['used_storage_megabyte'] * MB_factor, 50263000,
                          msg="The used storage is now 50.263")

        # create a file with 115000 bytes (115 KB) with user2
        file2 = self.rest_create_file(self.token2, None, 'Test Title', 'Test Description',
                                      'somefile.txt', 115000, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(file2.status_code, status.HTTP_201_CREATED)

        # check if the used storage for user1 is the same as before
        response = self.rest_get_me(self.token1)
        decoded = json.loads(response.content.decode())
        self.assertEquals(decoded['used_storage_megabyte'] * MB_factor, 50263000,
                          msg="The used storage is now 50.263")

        # check if the used storage for user2 is correct
        response = self.rest_get_me(self.token2)
        decoded = json.loads(response.content.decode())
        self.assertEquals(decoded['used_storage_megabyte'] * MB_factor, 115000,
                          msg="The used storage is now 0.115")

    def test_reach_user_storage_limit(self):
        """checks if an exception is thrown when the user storage limit was reached"""
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + self.token1)

        # create a file with 502639000 bytes (502,639 MB)
        response = self.rest_create_file(self.token1, self.project.pk, 'Test Title', 'Test Description',
                                         'somefile.txt', 502639000, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_507_INSUFFICIENT_STORAGE)
        # check if the available storage is correct
        decoded = json.loads(response.content.decode())
        self.assertEquals(decoded['available_storage'], 100.0,
                          msg="The available storage should be 100.0")

        # check if the used storage is correct
        response = self.rest_get_me(self.token1)
        decoded = json.loads(response.content.decode())
        self.assertEquals(decoded['used_storage_megabyte'], 0,
                          msg="The used storage is 0")

        # create a file with 115000 bytes (115 KB)
        file = self.rest_create_file(self.token1, self.project.pk, 'Test Title', 'Test Description',
                                     'somefile.txt', 115000, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(file.status_code, status.HTTP_201_CREATED)

        # create another file with 502639000 bytes (502,639 MB)
        response = self.rest_create_file(self.token1, self.project.pk, 'Test Title', 'Test Description',
                                         'somefile.txt', 502639000, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_507_INSUFFICIENT_STORAGE)
        # check if the available storage is correct
        decoded = json.loads(response.content.decode())
        self.assertEquals(decoded['available_storage'], 100 - 115000 / 1024 / 1024,
                          msg="The available storage should be 99.885000")

        # check if the used storage is correct
        response = self.rest_get_me(self.token1)
        decoded = json.loads(response.content.decode())
        self.assertEquals(decoded['used_storage_megabyte'], 115000 / 1024 / 1024,
                          msg="The used storage is 0.115")

        # create a file entry with 502639000 bytes (502,639 MB)
        response = self.rest_update_file(self.token1, file.data['pk'], self.project.pk, 'Test Title',
                                         'Test Description', 'yetanother.txt', 502639000, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_507_INSUFFICIENT_STORAGE)

        # check if the available storage is correct
        decoded = json.loads(response.content.decode())
        self.assertEquals(decoded['available_storage'], 100 - 115000 / 1024 / 1024,
                          msg="The available storage should be 99.885000")

        # check if the used storage is correct
        response = self.rest_get_me(self.token1)
        decoded = json.loads(response.content.decode())
        self.assertEquals(decoded['used_storage_megabyte'], 115000 / 1024 / 1024,
                          msg="The used storage is 0.115")
