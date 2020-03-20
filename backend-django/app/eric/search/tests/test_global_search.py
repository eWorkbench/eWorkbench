#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.contrib.auth.models import Group
from django.contrib.auth import get_user_model
User = get_user_model()

from rest_framework.test import APITestCase

from eric.projects.tests.core import AuthenticationMixin
from eric.search.tests.core import FTSDataMixin


class FTSSearchTest(APITestCase, AuthenticationMixin, FTSDataMixin):
    """ Extensive testing of search endpoint """

    # set up users
    def setUp(self):
        """ set up a couple of users """
        # get user group
        self.user_group = Group.objects.get(name='User')

        # create users and assign them to the user group
        self.user1 = User.objects.create_user(
            username='student_1', email='student_1@email.com', password='top_secret')
        self.user1.groups.add(self.user_group)

    def rest_search(self, auth_token, search_term, http_user_agent, http_remote_addr):
        """ Wrapper for calling the search REST API """
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + auth_token)

        return self.client.get(
            '/api/search/?search={}'.format(search_term),
            {}, HTTP_USER_AGENT=http_user_agent, REMOTE_ADDR=http_remote_addr
        )

    def test_global_search(self):
        http_user_agent = "APITestClient"
        http_remote_addr = "127.0.0.1"

        auth_token = self.login_and_return_token(self.user1.username, 'top_secret', http_user_agent, http_remote_addr)
        self.create_test_projects(auth_token)

        # searching for a stop-word should give no results
        self.assertEqual(len(self.rest_search(auth_token, 'the', http_remote_addr, http_user_agent).data), 0)

        # searching for a word with umlauts should work
        self.assertEqual(len(self.rest_search(auth_token, 'über', http_remote_addr, http_user_agent).data), 1)

        # searching for a word with umlauts without actually using the umlaut should work
        self.assertEqual(len(self.rest_search(auth_token, 'uber', http_remote_addr, http_user_agent).data), 1)

        # searching for a word in it's singular form should match the singular and plural forms
        self.assertEqual(len(self.rest_search(auth_token, 'fat rat', http_remote_addr, http_user_agent).data), 1)

        # searching for a word in it's plural form should match the singular and plural forms
        self.assertEqual(len(self.rest_search(auth_token, 'rats', http_remote_addr, http_user_agent).data), 1)

        # searching for a words in the wrong order should also match
        self.assertEqual(len(self.rest_search(auth_token, 'rats cat', http_remote_addr, http_user_agent).data), 1)
