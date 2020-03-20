#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import json
import os
import tempfile

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Permission
from rest_framework import status

from eric.core.tests import custom_json_handler

from eric.sortable_menu.models import MenuEntry, MenuEntryParameter

User = get_user_model()


class MenuEntryMixin:
    """
    Mixin which provides several wrapper methods for the
    api/menu_entries/ endpoint
    """

    def rest_get_menu_entries(self, auth_token, HTTP_USER_AGENT, REMOTE_ADDR):
        """
        REST Wrapper for an api call to retrieve all menu entries for the current user
        :param auth_token:
        :param HTTP_USER_AGENT:
        :param REMOTE_ADDR:
        :return:
        """
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + auth_token)

        return self.client.get(
            '/api/menu_entries/',
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_get_menu_entry(self, auth_token, menu_entry_pk, HTTP_USER_AGENT, REMOTE_ADDR):
        """
        REST Wrapper for an api call to retrieve the specified menu entry by primary key
        :param auth_token:
        :param HTTP_USER_AGENT:
        :param REMOTE_ADDR:
        :return:
        """
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + auth_token)

        return self.client.get(
            '/api/menu_entries/{pk}/'.format(pk=menu_entry_pk),
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_update_menu_entries(self, auth_token, menu_entries, HTTP_USER_AGENT, REMOTE_ADDR):
        """
        REST Wrapper for an api call to update all menu entries for the current user
        :param auth_token:
        :param menu_entries:
        :param HTTP_USER_AGENT:
        :param REMOTE_ADDR:
        :return:
        """
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + auth_token)

        return self.client.put(
            '/api/menu_entries/update_ordering/',
            json.dumps(menu_entries, default=custom_json_handler), content_type='application/json',
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )
