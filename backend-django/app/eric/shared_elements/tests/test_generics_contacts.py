#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import json

from django.utils.timezone import datetime, timedelta
from rest_framework import status
from rest_framework.test import APITestCase

from eric.shared_elements.models import Contact
from eric.shared_elements.tests.core import ContactMixin, MeetingMixin
from eric.projects.tests.mixin_entity_generic_tests import EntityChangeRelatedProjectTestMixin

HTTP_USER_AGENT = "APITestClient"
REMOTE_ADDR = "127.0.0.1"


class TestGenericsContacts(APITestCase, EntityChangeRelatedProjectTestMixin, MeetingMixin, ContactMixin):
    entity = Contact

    def setUp(self):
        self.superSetUp()

        self.data = [{
            'academic_title': "Dr.",
            'firstname': "Tony",
            'lastname': "Stark",
            'project_pks': None,
            'email': 'tony@stark-industries.com',
            'phone': '',
            'company': "Stark Industries"
        }, {
            'academic_title': "",
            'firstname': "I am",
            'lastname': "Groot",
            'project_pks': None,
            'email': 'groot@groot.org',
            'phone': '',
            'company': ''
        }]

    def test_contact_privileges_for_meeting_with_attending_users(self):
        """
        Whenever a user attends a meeting, they should be able to see all contacts
        :return:
        """
        contact = self.generic_create_entity_and_return_from_db(self.token1, 0)
        # try to get contact with user2 (should not work)
        response = self.rest_get_contact(self.token2, contact.pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_404_NOT_FOUND)

        # create a meeting with user2 and contact
        response = self.rest_create_meeting(self.token1, None, "Meeting Title", "Meeting Description", datetime.now(), datetime.now(), HTTP_USER_AGENT, REMOTE_ADDR, [self.user2.pk], [contact.pk])
        self.assertEquals(response.status_code, status.HTTP_201_CREATED)

        # now try to get contact with user2 (should work)
        response = self.rest_get_contact(self.token2, contact.pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # get privileges of contact
        response = self.rest_get_privileges_for_user(self.token2, "contacts", contact.pk, self.user2.pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_200_OK)
        decoded_response = json.loads(response.content.decode())
        self.assertEquals(decoded_response['user_pk'], self.user2.pk)
        self.assertEquals(decoded_response['view_privilege'], "AL")
