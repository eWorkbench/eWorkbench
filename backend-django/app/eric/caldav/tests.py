#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from unittest import mock

import vobject
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Permission
from django.utils.timezone import now
from rest_framework.status import HTTP_201_CREATED
from rest_framework.test import APITestCase

from eric.caldav.storage import Collection
from eric.caldav.wrappers import VEventWrapper
from eric.projects.tests.core import AuthenticationMixin, UserMixin
from eric.shared_elements.tests.core import MeetingMixin, UserAttendsMeetingMixin

User = get_user_model()

COMMON_DATA = {
    'HTTP_USER_AGENT': 'APITestClient',
    'REMOTE_ADDR': '127.0.0.1'
}

CALDAV_PATH = 'default'


class CollectionTest(APITestCase, UserMixin, UserAttendsMeetingMixin, AuthenticationMixin, MeetingMixin):
    def setUp(self):
        user1 = User.objects.create_user(username='user1', password='secret', email='user1@test.local')
        user2 = User.objects.create_user(username='user2', password='secret', email='user2@test.local')

        permission = Permission.objects.get(codename='add_meeting_without_project')
        user1.user_permissions.add(permission)
        user2.user_permissions.add(permission)

        token1 = self.login_and_return_token(user1.username, 'secret')
        token2 = self.login_and_return_token(user2.username, 'secret')

        # Meeting where user1 is CREATOR/ORGANIZER
        self.meeting_created_by_user1, response = self.create_meeting_orm(
            auth_token=token1, project_pk=None, title='Appointment created by user1',
            description='', start_date=now(), end_date=now(),
            **COMMON_DATA
        )
        self.assertEquals(response.status_code, HTTP_201_CREATED, response.content.decode())

        # Meeting where user1 is ATTENDING
        self.meeting_where_user1_is_attending, response = self.create_meeting_orm(
            auth_token=token2, project_pk=None, title='Appointment where user1 is attending',
            description='', start_date=now(), end_date=now(),
            attending_users=[user1.pk],
            **COMMON_DATA
        )
        self.assertEquals(response.status_code, HTTP_201_CREATED, response.content.decode())

        # Meeting that is not linked to user1
        self.meeting_not_linked_to_user1, response = self.create_meeting_orm(
            auth_token=token2, project_pk=None, title='Appointment that is not linked to user1',
            description='', start_date=now(), end_date=now(),
            **COMMON_DATA
        )
        self.assertEquals(response.status_code, HTTP_201_CREATED, response.content.decode())

        self.user1 = user1

    @mock.patch('eric.caldav.models.querysets.get_current_user')
    @mock.patch('eric.shared_elements.models.querysets.get_current_user')
    def test_attending_events_synced(self, mock_current_user1, mock_current_user2):
        mock_current_user1.return_value = self.user1
        mock_current_user2.return_value = self.user1

        items = Collection(CALDAV_PATH).items
        meeting_titles = read_meeting_titles_from_vobjects(items)
        self.assertIn(self.meeting_where_user1_is_attending.title, meeting_titles)

    @mock.patch('eric.caldav.models.querysets.get_current_user')
    @mock.patch('eric.shared_elements.models.querysets.get_current_user')
    def test_organized_events_synced(self, mock_current_user1, mock_current_user2):
        mock_current_user1.return_value = self.user1
        mock_current_user2.return_value = self.user1

        items = Collection(CALDAV_PATH).items
        meeting_titles = read_meeting_titles_from_vobjects(items)
        self.assertIn(self.meeting_created_by_user1.title, meeting_titles)

    @mock.patch('eric.caldav.models.querysets.get_current_user')
    @mock.patch('eric.shared_elements.models.querysets.get_current_user')
    def test_unlinked_event_is_not_synced(self, mock_current_user1, mock_current_user2):
        mock_current_user1.return_value = self.user1
        mock_current_user2.return_value = self.user1

        items = Collection(CALDAV_PATH).items
        meeting_titles = read_meeting_titles_from_vobjects(items)
        self.assertNotIn(self.meeting_not_linked_to_user1.title, meeting_titles)


def read_meeting_titles_from_vobjects(items):
    return [
        VEventWrapper(vobject.readOne(item.text)).read('summary')
        for item in items.values()
    ]
