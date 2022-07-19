#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import json
from django.contrib.auth.models import Group
from django.contrib.auth import get_user_model
from django.conf import settings

from rest_framework.test import APITestCase
from rest_framework import status

from eric.projects.tests.core import AuthenticationMixin

from eric.sortable_menu.tests.core import MenuEntryMixin
from eric.sortable_menu.models import MenuEntry, MenuEntryParameter

User = get_user_model()

# read http://www.django-rest-framework.org/api-guide/testing/ for more info about testing with django rest framework

HTTP_USER_AGENT = "APITestClient"
REMOTE_ADDR = "127.0.0.1"


class SortableMenuTest(APITestCase, AuthenticationMixin, MenuEntryMixin):
    """ Extensive testing of project endpoint """

    # set up users
    def setUp(self):
        # get user group
        self.user_group = Group.objects.get(name='User')

        # create 4 users and assign them to the user group
        self.user1 = User.objects.create_user(
            username="student_1", email="student_1@email.com", password="top_secret")
        self.user1.groups.add(self.user_group)

        self.user2 = User.objects.create_user(
            username="student_2", email="student_2@email.com", password="foobar")
        self.user2.groups.add(self.user_group)

    def test_login_auto_create_menu_entries(self):
        """
        Validates that menu entries are automatically created for users that do not have menu entries
        :return:
        """
        cnt_default_menu_entries = len(settings.WORKBENCH_SETTINGS['default_menu_entries'])

        self.assertEquals(MenuEntry.objects.all().count(), 0,
                          msg="There should be zero menu entries to start with")
        self.token1 = self.login_and_return_token("student_1", "top_secret", HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(
            MenuEntry.objects.all().count(), cnt_default_menu_entries,
            msg="There should be zero menu entries to start with"
        )
        # get new parameter count
        param_cnt = MenuEntryParameter.objects.all().count()
        self.assertEquals(
            param_cnt,
            0
        )

        self.token2 = self.login_and_return_token("student_2", "foobar", HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(
            MenuEntry.objects.all().count(), 2*cnt_default_menu_entries,
            msg="There should be zero menu entries to start with"
        )

        # param count should be greater now
        self.assertEquals(
            MenuEntryParameter.objects.all().count(),
            param_cnt
        )

    def test_list_menu_entries(self):
        """
        Tests the list menu entries api endpoint
        :return:
        """
        cnt_default_menu_entries = len(settings.WORKBENCH_SETTINGS['default_menu_entries'])

        # login
        self.token1 = self.login_and_return_token("student_1", "top_secret", HTTP_USER_AGENT, REMOTE_ADDR)

        # get /api/menu_entries/
        response = self.rest_get_menu_entries(self.token1, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_200_OK)
        decoded_response = json.loads(response.content.decode())

        # there should be cnt_default_menu_entries in that response
        self.assertEquals(len(decoded_response), cnt_default_menu_entries)

    def test_update_menu_entry_order(self):
        """
        Tests updating the menu entry order
        :return:
        """
        # login
        self.token1 = self.login_and_return_token("student_1", "top_secret", HTTP_USER_AGENT, REMOTE_ADDR)

        # get /api/menu_entries/
        response = self.rest_get_menu_entries(self.token1, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_200_OK)
        menu_entries = json.loads(response.content.decode())

        # change the order of menu entry 0 and 2
        new_ordering_for_2 = menu_entries[0]['ordering']
        new_ordering_for_0 = menu_entries[0]['ordering'] = menu_entries[2]['ordering']
        menu_entries[2]['ordering'] = new_ordering_for_2

        response = self.rest_update_menu_entries(self.token1, menu_entries, HTTP_USER_AGENT, REMOTE_ADDR)
        print(response.content.decode())
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # verify ordering
        self.assertEquals(MenuEntry.objects.get(pk=menu_entries[0]['pk']).ordering, new_ordering_for_0)
        self.assertEquals(MenuEntry.objects.get(pk=menu_entries[2]['pk']).ordering, new_ordering_for_2)
