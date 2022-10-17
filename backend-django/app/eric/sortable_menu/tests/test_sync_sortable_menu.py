#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.contrib.auth import get_user_model
from django.core.management import call_command

from rest_framework.test import APITestCase

from eric.core.models import disable_permission_checks
from eric.projects.tests.core import AuthenticationMixin
from eric.sortable_menu.models import MenuEntry, MenuEntryParameter

User = get_user_model()

HTTP_USER_AGENT = "APITestClient"
REMOTE_ADDR = "127.0.0.1"


class SyncSortableMenuTest(APITestCase, AuthenticationMixin):
    """
    Tests the sync_sortable_menu management command
    """

    def test_command_without_users(self):
        # initially there should be zero users and zero menu entries
        self.assertEqual(User.objects.all().count(), 0)
        self.assertEqual(MenuEntry.objects.all().count(), 0)

        call_command("sync_sortable_menu")

        # as there are no users, the command should not have changed anything
        self.assertEqual(User.objects.all().count(), 0)
        self.assertEqual(MenuEntry.objects.all().count(), 0)

    def test_command_with_users(self):
        User.objects.create_user(username="student_1", email="student_1@email.com", password="top_secret")

        # there should now be one user
        self.assertEqual(User.objects.all().count(), 1)
        # but no menu entries
        self.assertEqual(MenuEntry.objects.all().count(), 0)

        # login with user1
        self.login_and_return_token("student_1", "top_secret", HTTP_USER_AGENT, REMOTE_ADDR)

        # store number of entries
        num_entries = MenuEntry.objects.all().count()

        # this should create menu entries
        self.assertNotEqual(num_entries, 0)

        with disable_permission_checks(MenuEntry):
            with disable_permission_checks(MenuEntryParameter):
                # delete all but one menu entry
                MenuEntry.objects.all().exclude(pk=MenuEntry.objects.all().first().pk).delete()

        # there should now be exactly one
        self.assertEqual(MenuEntry.objects.all().count(), 1)

        # call the command, which should create the menu entries
        call_command("sync_sortable_menu")

        # there should now be more than one menu entry
        self.assertGreater(MenuEntry.objects.all().count(), 1)
