#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import json

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.utils.translation import ugettext_lazy as _
from rest_framework import status
from rest_framework.test import APITestCase

from eric.projects.models import Role
from eric.projects.tests.core import AuthenticationMixin, UserMixin, MeMixin
from eric.userprofile.models import UserProfile

User = get_user_model()

HTTP_USER_AGENT = "APITestClient"
REMOTE_ADDR = "127.0.0.1"


class UserProfileTest(APITestCase, AuthenticationMixin, UserMixin, MeMixin):
    """ Testing of permissions of the project endpoint """

    # set up users
    def setUp(self):
        """ set up a couple of users """
        self.user1 = User.objects.create_user(
            username='student_1', email='student_1@email.com', password='top_secret')
        self.token1 = self.login_and_return_token('student_1', 'top_secret')

        self.user2 = User.objects.create_user(
            username='student_2', email='student_2@email.com', password='foobar')
        self.token2 = self.login_and_return_token('student_2', 'foobar')

        self.student_role = self.create_student_role()

        self.pm_role = Role.objects.filter(default_role_on_project_create=True).first()

        self.user_group = Group.objects.get(name='User')

        self.user1.groups.add(self.user_group)

        # create an ldap user
        self.token3 = self.login_and_return_token('normaluser', 'normaluser')
        self.user3 = User.objects.filter(username='normaluser').first()

    def test_get_users(self):
        """ Test getting the users endpoint and finding specific users """
        response = self.rest_get_users(self.token1, HTTP_USER_AGENT, REMOTE_ADDR)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # check the response (should only contain 1 user, the current user)
        decoded = json.loads(response.content.decode())

        self.assertEqual(len(decoded), 1)

    def test_search_users(self):
        """ Test searching for users """
        # try to find a user that does not exist
        response = self.rest_search_for_users(self.token1, "Long Query", HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # should be empty
        decoded = json.loads(response.content.decode())
        self.assertEqual(len(decoded), 0)

        # try to find users that exist
        response = self.rest_search_for_users(self.token1, "student", HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # should be empty
        decoded = json.loads(response.content.decode())
        self.assertEqual(len(decoded), 0)

        # create new project
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + self.token1)
        response = self.client.post(
            '/api/projects/',
            {
                'name': 'Test project',
                'description': 'Test description',
                'project_state': 'INIT'
            },
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        project_details = json.loads(response.content.decode())

        # try to find users that exist
        response = self.rest_search_for_users(self.token1, "student", HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # should be exactly 1
        decoded = json.loads(response.content.decode())
        self.assertEqual(len(decoded), 1)

        # assign a second user to the project
        response = self.client.post(
            '/api/projects/{}/acls/'.format(project_details['pk']),
            {
                'user_pk': self.user2.pk,
                'role_pk': self.student_role.pk
            },
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # try to find users that exist
        response = self.rest_search_for_users(self.token1, "student", HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # should be exactly 2
        decoded = json.loads(response.content.decode())
        self.assertEqual(len(decoded), 2)

        # try to find a single user student_2@email.com'
        response = self.rest_search_for_users(self.token1, "student_2@email.com", HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # should be exactly 1
        decoded = json.loads(response.content.decode())
        self.assertEqual(len(decoded), 1)

    def test_invite_user_which_already_exists(self):
        """ Tests inviting a user via e-mail which already exists in the database """
        response = self.rest_invite_external_user(self.token1, "student_1@email.com", "Hello", HTTP_USER_AGENT,
                                                  REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        decoded = json.loads(response.content.decode())
        self.assertTrue('email' in decoded, msg="Check that the response message says that the e-mail already exists")
        self.assertTrue('already' in str(decoded['email']),
                        msg="Check that the response message says that the e-mail already exists")

    def test_change_password(self):
        """ Tests changing the password of an user account """
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + self.token1)
        new_password = 'new_password'

        # change password of user1
        response = self.client.put(
            '/api/me/change_password/',
            {
                'password': new_password
            }, HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # login as user1 with the new password
        self.token1 = self.login_and_return_token('student_1', new_password)

    def test_change_password_too_common(self):
        """ Tests changing the password of an user account when the password is too common"""
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + self.token1)
        username = 'student_1'
        new_password = 'password'  # common password

        # change password of user1
        response = self.client.put(
            '/api/me/change_password/',
            {
                'password': new_password
            }, HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        # login as user1 with the new password (should not work)
        # reset auth token in header, if it exists
        self.reset_client_credentials()

        # login with self.user1, a given user agent and remote address
        response = self.client.post('/api/auth/login',
                                    {'username': username, 'password': new_password},
                                    HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR)

        # check if login was successful (should not be)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_get_current_user(self):
        """ Tests retrieving the current user based on the auth token """
        response = self.rest_get_user_with_pk(self.token1, self.user1.pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_200_OK)
        decoded_response = json.loads(response.content.decode())
        self.assertEquals(decoded_response['username'], self.user1.username)

    def test_get_current_ldap_user(self):
        """ Tests retrieving the current ldap user based on the auth token """
        token = self.login_and_return_token('normaluser', 'normaluser')
        user = User.objects.filter(username='normaluser').first()

        response = self.rest_get_user_with_pk(token, user.pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_200_OK)
        decoded_response = json.loads(response.content.decode())
        self.assertEquals(decoded_response['username'], user.username)

    def test_change_profile(self):
        """ Tests the update profile endpoint of a user """
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + self.token1)

        # get user profile
        response = self.rest_get_user_with_pk(self.token1, self.user1.pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_200_OK)
        cur_user = json.loads(response.content.decode())
        del cur_user['userprofile']['avatar']
        self.assertEquals(cur_user['email'], self.user1.email)

        # set email to something else
        cur_user['email'] = "anotheremail@johndoe.com"

        # do the api call
        self.rest_put_me(self.token1, json.dumps(cur_user), assert_status=status.HTTP_200_OK)

        self.user1.refresh_from_db()
        self.assertEquals(self.user1.email, cur_user['email'])

    def test_change_profile_validation(self):
        """ Tests validation of change profile endpoint (e.g., invalid email) """
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + self.token1)

        # get user profile
        response = self.rest_get_user_with_pk(self.token1, self.user1.pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_200_OK)
        cur_user = json.loads(response.content.decode())
        del cur_user['userprofile']['avatar']
        self.assertEquals(cur_user['email'], self.user1.email)

        # set email to something wrong
        cur_user['email'] = "johndoe.com"

        # do the api call
        response = self.rest_put_me(self.token1, json.dumps(cur_user), assert_status=status.HTTP_400_BAD_REQUEST)
        decoded_response = json.loads(response.content.decode())
        self.assertTrue('email' in decoded_response)

        # set website to something wrong
        cur_user['userprofile']['website'] = "johndoe.com"
        cur_user['email'] = "john@doe.com"

        # do the api call
        response = self.rest_put_me(self.token1, json.dumps(cur_user), assert_status=status.HTTP_400_BAD_REQUEST)
        decoded_response = json.loads(response.content.decode())
        self.assertTrue('email' not in decoded_response)
        self.assertTrue('userprofile' in decoded_response)
        self.assertTrue('website' in decoded_response['userprofile'])

    def test_change_profile_for_ldap_users(self):
        """ Tests the update profile endpoint for a ldap user
        LDAP users are allowed to change website and additional_information, but nothing else
        """
        response = self.rest_get_user_with_pk(self.token3, self.user3.pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_200_OK)
        cur_user = json.loads(response.content.decode())
        del cur_user['userprofile']['avatar']
        self.assertEquals(cur_user['email'], self.user3.email)

        # try to change the salutation of this user (should not work)
        cur_user['userprofile']['title_salutation'] = "Dr."

        # do the api call
        response = self.rest_put_me(self.token3, json.dumps(cur_user), assert_status=status.HTTP_400_BAD_REQUEST)
        decoded_response = json.loads(response.content.decode())
        self.assertTrue('title_salutation' in decoded_response)
        self.assertEquals(decoded_response['title_salutation'],
                          [_("Can not update this field, as information is retrieved automatically from LDAP")])

        # verify this field has not been updated in database
        self.user3.refresh_from_db()
        self.assertNotEquals(self.user3.userprofile.title_salutation, "Dr.")

    def test_profile_type_can_not_be_changed(self):
        """
        Verifies that the userprofile.type can not be changed (this is determined by the system)
        :return:
        """
        response = self.rest_get_user_with_pk(self.token3, self.user3.pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_200_OK)
        cur_user = json.loads(response.content.decode())
        del cur_user['userprofile']['avatar']
        self.assertEquals(cur_user['email'], self.user3.email)
        self.assertEquals(cur_user['userprofile']['type'], UserProfile.LDAP_USER)

        # try to change the salutation of this user (should not work)
        cur_user['userprofile']['type'] = UserProfile.NORMAL_USER

        # do the api call (should work, but not change anything)
        self.rest_put_me(self.token3, json.dumps(cur_user), assert_status=status.HTTP_200_OK)

        self.user3.refresh_from_db()
        self.assertEquals(self.user3.userprofile.type, UserProfile.LDAP_USER)

    def test_profile_jwt_verification_token(self):
        """
        Verifies that new users have a jwt_verification_token
        :return:
        """
        self.assertNotEquals(self.user1.userprofile.jwt_verification_token, '')
        self.assertNotEquals(self.user2.userprofile.jwt_verification_token, '')
        self.assertNotEquals(self.user3.userprofile.jwt_verification_token, '')
