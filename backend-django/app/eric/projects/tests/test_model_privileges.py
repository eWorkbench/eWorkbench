#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import json

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.contrib.auth.models import Permission

User = get_user_model()

from rest_framework.test import APITestCase
from rest_framework import status

from eric.shared_elements.models import File
from eric.model_privileges.models import ModelPrivilege
from eric.projects.tests.core import AuthenticationMixin, UserMixin, ProjectsMixin, ModelPrivilegeMixin
from eric.shared_elements.tests.core import FileMixin

# read http://www.django-rest-framework.org/api-guide/testing/ for more info about testing with django rest framework

HTTP_USER_AGENT = "APITestClient"
REMOTE_ADDR = "127.0.0.1"


class ModelPrivilegeTestCase(APITestCase, AuthenticationMixin, UserMixin, FileMixin, ProjectsMixin, ModelPrivilegeMixin):
    """
    Tests the Entity Permission Assignment
    """
    def setUp(self):
        """ Set up a couple of users and roles and projects """
        self.user_group = Group.objects.get(name='User')

        # get add_file and add_file_without_project permission
        self.add_file_permission = Permission.objects.filter(
            codename='add_file',
            content_type=File.get_content_type()
        ).first()

        self.user1 = User.objects.create_user(
            username='student_1', email='student_1@email.com', password='top_secret')

        self.user1.user_permissions.add(self.add_file_permission)

        self.token1 = self.login_and_return_token('student_1', 'top_secret')
        self.user1.groups.add(self.user_group)

        self.user2 = User.objects.create_user(
            username='student_2', email='student_2@email.com', password='foobar')
        self.user2.groups.add(self.user_group)

        self.user3 = User.objects.create_user(
            username='student_3', email='student_3@email.com', password='foobar')
        self.user3.groups.add(self.user_group)

        self.superuser = User.objects.create_user(
            username='superuser', email='super@user.com', password='sudo', is_superuser=True
        )

        # login
        self.token1 = self.login_and_return_token('student_1', 'top_secret', HTTP_USER_AGENT, REMOTE_ADDR)
        self.token2 = self.login_and_return_token('student_2', 'foobar', HTTP_USER_AGENT, REMOTE_ADDR)
        self.superuser_token = self.login_and_return_token('superuser', 'sudo', HTTP_USER_AGENT, REMOTE_ADDR)

    def test_create_new_object(self):
        """
        Creates a new object and checks if a model privilege with "full access" is created
        """
        self.assertEquals(ModelPrivilege.objects.all().count(), 3,
                          msg="There should only be 3 unrelated entity permission assignments coming from "
                              "calendar access privileges for 3 users.")

        response = self.rest_create_file(self.token1, None, "Some Title", "Some Description", "file.txt", 1024, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_201_CREATED)
        decoded_file_object = json.loads(response.content.decode())

        # verify that a new entity permission assignment has been created
        self.assertEquals(ModelPrivilege.objects.all().count(), 4,
                          msg="There should be one entity permission assignments and three "
                              "more coming from calendar access privileges")
        # verify that it belongs to user1
        model_privilege = ModelPrivilege.objects.all().filter(content_type=File.get_content_type())[0]

        self.assertEquals(model_privilege.user, self.user1)
        self.assertEquals(model_privilege.content_type, File.get_content_type())
        self.assertEquals(str(model_privilege.object_id), decoded_file_object['pk'])
        self.assertEquals(model_privilege.full_access_privilege, ModelPrivilege.ALLOW)

        # call rest api to get privileges for this file
        response = self.rest_get_privileges(self.token1, "files", decoded_file_object['pk'], HTTP_USER_AGENT,
                                            REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # decode response
        decoded_privileges = json.loads(response.content.decode())
        # there should be exactly one privilege
        self.assertEquals(len(decoded_privileges), 1, msg="There should be exactly one privilege")
        self.assertEquals(decoded_privileges[0]['object_id'], decoded_file_object['pk'])
        # full access privilege should be set
        self.assertEquals(decoded_privileges[0]['full_access_privilege'], ModelPrivilege.ALLOW)
        # all other privileges should be set to neutral
        self.assertEquals(decoded_privileges[0]['view_privilege'], ModelPrivilege.NEUTRAL)
        self.assertEquals(decoded_privileges[0]['edit_privilege'], ModelPrivilege.NEUTRAL)
        self.assertEquals(decoded_privileges[0]['delete_privilege'], ModelPrivilege.NEUTRAL)
        self.assertEquals(decoded_privileges[0]['restore_privilege'], ModelPrivilege.NEUTRAL)
        self.assertEquals(decoded_privileges[0]['trash_privilege'], ModelPrivilege.NEUTRAL)

    def test_change_last_owner_from_model_privilege(self):
        """
        Tries to remove the last is_owner from an entity permission assignment (which should fail)
        """
        self.assertEquals(ModelPrivilege.objects.all().count(), 3,
                          msg="There should only be 3 unrelated entity permission assignments coming from "
                              "calendar access privileges for 3 users.")

        response = self.rest_create_file(self.token1, None, "Some Title", "Some Description", "file.txt", 1024,
                                         HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_201_CREATED)
        decoded_file_object = json.loads(response.content.decode())

        # verify that a new entity permission assignment has been created
        self.assertEquals(ModelPrivilege.objects.all().count(), 4,
                          msg="There should be one entity permission assignments and three "
                              "more coming from calendar access privileges")

        # verify that it belongs to user1
        model_privilege = ModelPrivilege.objects.all()[0]

        # try the same change via REST API (should not work)
        response = self.rest_update_privilege(
            self.token1, "files", decoded_file_object['pk'], self.user1.pk,
            {'full_access_privilege': ModelPrivilege.DENY}, HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEquals(response.status_code, status.HTTP_400_BAD_REQUEST)

        # verify that it has not changed
        model_privilege = ModelPrivilege.objects.all()[0]
        self.assertEquals(model_privilege.full_access_privilege, ModelPrivilege.ALLOW)

        # add another user with the full access privilege
        response = self.rest_create_privilege(
            self.token1, "files", decoded_file_object['pk'], self.user2.pk, HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEquals(response.status_code, status.HTTP_201_CREATED)

        # try to change full access of user1 (should not work)
        response = self.rest_update_privilege(
            self.token1, "files", decoded_file_object['pk'], self.user1.pk,
            {'full_access_privilege': ModelPrivilege.DENY}, HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEquals(response.status_code, status.HTTP_400_BAD_REQUEST)

        # verify that it has not changed
        model_privilege = ModelPrivilege.objects.all()[0]
        self.assertEquals(model_privilege.full_access_privilege, ModelPrivilege.ALLOW)

        # now give user2 full access
        response = self.rest_patch_privilege(
            self.token1, "files", decoded_file_object['pk'], self.user2.pk,
            {'full_access_privilege': ModelPrivilege.ALLOW}, HTTP_USER_AGENT, REMOTE_ADDR
        )
        print(response.content.decode())
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # we should now be able to remove the full access privilege of user1
        response = self.rest_patch_privilege(
            self.token1, "files", decoded_file_object['pk'], self.user1.pk,
            {'full_access_privilege': ModelPrivilege.DENY}, HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEquals(response.status_code, status.HTTP_200_OK)

    def test_add_user_multiple_times_to_privileges(self):
        """
        Tries adding a user multiple times to the privileges, which should not work
        :return:
        """
        self.assertEquals(ModelPrivilege.objects.all().count(), 3,
                          msg="There should only be 3 unrelated entity permission assignments coming from "
                              "calendar access privileges for 3 users.")

        # create a new file with user1
        response = self.rest_create_file(self.token1, None, "Some Title", "Some Description", "file.txt", 1024,
                                         HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_201_CREATED)
        decoded_file_object = json.loads(response.content.decode())

        # call rest api to get privileges for this file
        response = self.rest_get_privileges(self.token1, "files", decoded_file_object['pk'], HTTP_USER_AGENT,
                                            REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # decode response
        decoded_privileges = json.loads(response.content.decode())
        # there should be exactly one privilege
        self.assertEquals(len(decoded_privileges), 1, msg="There should be exactly one privilege")

        # add user2 to the privileges
        response = self.rest_create_privilege(self.token1, "files", decoded_file_object['pk'], self.user2.pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_201_CREATED)

        # give user 2 the view privilege
        response = self.rest_patch_privilege(self.token1, "files", decoded_file_object['pk'], self.user2.pk, {
            'view_privilege': ModelPrivilege.ALLOW
        }, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # get all privileges for this file
        response = self.rest_get_privileges(self.token1, "files", decoded_file_object['pk'], HTTP_USER_AGENT,
                                            REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # decode response
        decoded_privileges = json.loads(response.content.decode())
        # there should be two privileges
        self.assertEquals(len(decoded_privileges), 2, msg="There should be two privileges")

        # add user2 again (should work, but not create an additional privilege)
        response = self.rest_create_privilege(self.token1, "files", decoded_file_object['pk'], self.user2.pk,
                                              HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # there should still be two privileges
        response = self.rest_get_privileges(self.token1, "files", decoded_file_object['pk'], HTTP_USER_AGENT,
                                            REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # decode response
        decoded_privileges = json.loads(response.content.decode())
        # there should be two privileges
        self.assertEquals(len(decoded_privileges), 2, msg="There should be two privileges")

        # try to add user1 (which should also not work)
        response = self.rest_create_privilege(self.token1, "files", decoded_file_object['pk'], self.user1.pk,
                                              HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_delete_last_user_with_full_access(self):
        """
        Deleting the last user with full access should not be possible
        """
        self.assertEquals(ModelPrivilege.objects.all().count(), 3,
                          msg="There should only be 3 unrelated entity permission assignments coming from "
                              "calendar access privileges for 3 users.")

        # create a new file with user1
        response = self.rest_create_file(self.token1, None, "Some Title", "Some Description", "file.txt", 1024,
                                         HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_201_CREATED)
        decoded_file_object = json.loads(response.content.decode())

        # try to delete the privilege
        response = self.rest_delete_privilege(
            self.token1, "files", decoded_file_object['pk'], self.user1.pk, HTTP_USER_AGENT, REMOTE_ADDR
        )
        print(response.content.decode())
        self.assertEquals(response.status_code, status.HTTP_400_BAD_REQUEST)

        # there should still be a privilege
        self.assertEquals(ModelPrivilege.objects.all().count(), 4,
                          msg="There should be one entity permission assignments and three "
                              "more coming from calendar access privileges")

    def test_delete_entity_delete_cascade_model_privileges(self):
        """
        Tests the delete cascade functionality of model privileges

        :return:
        """
        self.assertEquals(ModelPrivilege.objects.all().count(), 3,
                          msg="There should only be 3 unrelated entity permission assignments coming from "
                              "calendar access privileges for 3 users.")

        # create a new file with user1
        response = self.rest_create_file(self.token1, None, "Some Title", "Some Description", "file.txt", 1024,
                                         HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_201_CREATED, response.content.decode())
        decoded_file_object = json.loads(response.content.decode())

        # create a new model privilege for user2
        response = self.rest_create_privilege(self.token1, "files", decoded_file_object['pk'], self.user2.pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_201_CREATED, response.content.decode())

        # trash the file
        response = self.rest_trash_file(self.token1, decoded_file_object['pk'], HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_200_OK, response.content.decode())

        # delete the file (must be done by superuser)
        response = self.rest_delete_file(self.superuser_token, decoded_file_object['pk'], HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_204_NO_CONTENT, response.content.decode())

        # there should now be no files and no model privileges
        self.assertEquals(File.objects.all().count(), 0, msg="There should be zero files")
        self.assertEquals(ModelPrivilege.objects.all().count(), 3,
                          msg="There should only be three model privileges "
                              "coming from calendar access privileges")
