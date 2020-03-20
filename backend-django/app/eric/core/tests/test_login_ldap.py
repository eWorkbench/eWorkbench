#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import json

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from rest_framework.test import APITestCase
from rest_framework import status

# read http://www.django-rest-framework.org/api-guide/testing/ for more info about testing with django rest framework
from eric.projects.tests.core import AuthenticationMixin

User = get_user_model()


HTTP_USER_AGENT = "APITestClient"
REMOTE_ADDR = "127.0.0.1"


class LdapLoginTest(APITestCase, AuthenticationMixin):
    """ Basic Testing for logging in users that are listed in ldap """
    def setUp(self):
        from django.conf import settings

        setattr(
            settings, "AUTH_LDAP_USER_ASSIGN_GROUP_BASED_ON_ATTRIBUTE", {
                "o": [
                    {
                        "value_regex": "^employee$",
                        "group_name": "User"
                    },
                    {
                        "value_regex": "^external$",
                        "group_name": "External"
                    }
                ]
            }
        )

        # Get Group User
        self.user_group = Group.objects.get(name="User")

        # Create Group External
        self.external_group = Group.objects.get(name="External")

    def test_login_case_sensitive(self):
        """
        Tests whether the ldap login is case sensitive
        :return:
        """
        # verify that the two ldap users do not exist yet
        self.assertEquals(User.objects.filter(username="normaluser").exists(), False)

        # login with NormalUser (should not work)
        # reset auth token in header, if it exists
        self.reset_client_credentials()

        # login with big letters, a given user agent and remote address
        response = self.client.post('/api/auth/login',
                                    {'username': "NormalUser", 'password': "normaluser"},
                                    HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR)

        # check if login was successful
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # the username "NormalUser" is wrong, ldap lists it as "normaluser" - check that the correct user was created
        self.assertEquals(User.objects.filter(username="normaluser").exists(), True)
        self.assertEquals(User.objects.filter(username="NormalUser").exists(), False)

        # login with small letters, a given user agent and remote address
        response = self.client.post('/api/auth/login',
                                    {'username': "normaluser", 'password': "normaluser"},
                                    HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR)

        # check if login was successful
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # the username "NormalUser" is wrong, ldap lists it as "normaluser" - check that the correct user was created
        self.assertEquals(User.objects.filter(username="normaluser").exists(), True)
        self.assertEquals(User.objects.filter(username="NormalUser").exists(), False)

        self.assertEquals(User.objects.all().count(), 1)

    def test_login_and_group_assignment(self):
        """
        Logs in with normaluser which should be auto assigned to group "User"
        Logs in with externaluser which should be auto assigned to group "External"
        :return:
        """
        # verify that the two ldap users do not exist yet
        self.assertEquals(User.objects.filter(username="normaluser").exists(), False)
        self.assertEquals(User.objects.filter(username="externaluser").exists(), False)

        # login with normaluser
        self.token1 = self.login_and_return_token("normaluser", "normaluser", HTTP_USER_AGENT, REMOTE_ADDR)
        # now the user should exist
        self.assertEquals(User.objects.filter(username="normaluser").exists(), True)
        # and should have the group "User"
        normaluser = User.objects.get(username="normaluser")
        self.assertIn(self.user_group, normaluser.groups.all())
        # and not in group external
        self.assertNotIn(self.external_group, normaluser.groups.all())

        self.token2 = self.login_and_return_token("externaluser", "normaluser", HTTP_USER_AGENT, REMOTE_ADDR)
        # now the user should exist
        self.assertEquals(User.objects.filter(username="externaluser").exists(), True)
        # and should have the group "External"
        normaluser = User.objects.get(username="externaluser")
        self.assertIn(self.external_group, normaluser.groups.all())
        # and not in group user
        self.assertNotIn(self.user_group, normaluser.groups.all())
