#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import json

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.utils import timezone
from django.utils.timezone import timedelta
from rest_framework import status
from rest_framework.test import APITestCase

from eric.core.tests import REMOTE_ADDR, HTTP_USER_AGENT
from eric.projects.models import Role, Project
from eric.projects.tests.core import AuthenticationMixin, ProjectsMixin
from eric.shared_elements.models import Meeting, Contact
from eric.shared_elements.tests.core import UserAttendsMeetingMixin, ContactAttendsMeetingMixin, MeetingMixin, \
    ContactMixin

User = get_user_model()


class MeetingAttendingUsersContactsTest(APITestCase, AuthenticationMixin, ProjectsMixin,
                                        ContactMixin, MeetingMixin, UserAttendsMeetingMixin,
                                        ContactAttendsMeetingMixin):
    """ Extensive testing of api/meeting/ endpoint
    """

    def setUp(self):
        """ set up 3 users, a project, 4 contacts, 2 meetings"""

        # get user group
        self.user_group = Group.objects.get(name='User')

        # create 3 users and assign them to the user group
        self.user1 = User.objects.create_user(
            username='student_1', email='student_1@email.com', password='top_secret')
        self.user1.groups.add(self.user_group)

        self.user2 = User.objects.create_user(
            username='student_2', email='student_2@email.com', password='foobar')
        self.user2.groups.add(self.user_group)

        self.user3 = User.objects.create_user(
            username='student_3', email='student_3@email.com', password='foobar')
        self.user3.groups.add(self.user_group)

        # login
        self.token1 = self.login_and_return_token('student_1', 'top_secret', HTTP_USER_AGENT, REMOTE_ADDR)
        self.token2 = self.login_and_return_token('student_2', 'foobar', HTTP_USER_AGENT, REMOTE_ADDR)
        self.token3 = self.login_and_return_token('student_3', 'foobar', HTTP_USER_AGENT, REMOTE_ADDR)

        # use user1 token
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + self.token1)

        # create a new project
        self.project = self.create_project(self.token1, "New Project",
                                           "Unittest User / Contact attends meetings Project", Project.INITIALIZED,
                                           HTTP_USER_AGENT, REMOTE_ADDR)

        # there should be zero meetings
        self.assertEquals(Meeting.objects.all().count(), 0)
        # create four meetings

        # meeting 1
        response = self.rest_create_meeting(self.token1, self.project.pk, "First meeting", "Some Text for this meeting",
                                            timezone.now(), timezone.now(), HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_201_CREATED)
        decoded = json.loads(response.content.decode())
        self.meeting1 = Meeting.objects.get(pk=decoded['pk'])

        # unlock meeting1 with user1
        response = self.unlock(self.token1, "meetings", self.meeting1.pk, REMOTE_ADDR, HTTP_USER_AGENT)
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # meeting 2
        response = self.rest_create_meeting(self.token1, self.project.pk, "Second meeting",
                                            "Some Text for this meeting",
                                            timezone.now(), timezone.now(), HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_201_CREATED)
        decoded = json.loads(response.content.decode())
        self.meeting2 = Meeting.objects.get(pk=decoded['pk'])

        # unlock meeting2 with user1
        response = self.unlock(self.token1, "meetings", self.meeting2.pk, REMOTE_ADDR, HTTP_USER_AGENT)
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # meeting 3
        response = self.rest_create_meeting(self.token1, self.project.pk, "Third Appointment",
                                            "Some Text for this meeting",
                                            timezone.now(), timezone.now(), HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_201_CREATED)
        decoded = json.loads(response.content.decode())
        self.meeting3 = Meeting.objects.get(pk=decoded['pk'])

        # meeting 4
        response = self.rest_create_meeting(self.token1, self.project.pk, "Fourth Appointment",
                                            "Some Text for this meeting",
                                            timezone.now(), timezone.now(), HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_201_CREATED)
        decoded = json.loads(response.content.decode())
        self.meeting4 = Meeting.objects.get(pk=decoded['pk'])

        # create two contacts
        # contact 1
        response = self.rest_create_contact(self.token1, self.project.pk, "", "First", "NumberOne", "first@eric.net",
                                            HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_201_CREATED)
        decoded = json.loads(response.content.decode())
        self.contact1 = Contact.objects.get(pk=decoded['pk'])

        # unlock contact1 with user1
        response = self.unlock(self.token1, "contacts", self.contact1.pk, REMOTE_ADDR, HTTP_USER_AGENT)
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # contact 2
        response = self.rest_create_contact(self.token1, self.project.pk, "", "Second", "NumberTwo", "second@eric.net",
                                            HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_201_CREATED)
        decoded = json.loads(response.content.decode())
        self.contact2 = Contact.objects.get(pk=decoded['pk'])

        # unlock contact2 with user1
        response = self.unlock(self.token1, "contacts", self.contact2.pk, REMOTE_ADDR, HTTP_USER_AGENT)
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # contact 3 (not in a project, belongs to user1)
        response = self.rest_create_contact(self.token1, None, "", "Third", "NumberThree", "third@eric.net",
                                            HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_201_CREATED)
        decoded = json.loads(response.content.decode())
        self.contact3 = Contact.objects.get(pk=decoded['pk'])

        # get project manager role
        self.projectManagerRole = Role.objects.filter(default_role_on_project_create=True).first()

    def test_delete_attending_user(self):
        """ Tries to delete two attending users """

        # add 3 attending users
        user_pk_list = [self.user1.pk, self.user2.pk, self.user3.pk]

        response = self.update_attending_users(self.token1, self.meeting1.pk, user_pk_list,
                                               HTTP_USER_AGENT, REMOTE_ADDR)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # delete user1 and user2
        user_pk_list = [self.user3.pk]
        response = self.update_attending_users(self.token1, self.meeting1.pk, user_pk_list,
                                               HTTP_USER_AGENT, REMOTE_ADDR)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        decoded_response = json.loads(response.content.decode())
        self.assertEqual(len(decoded_response['attending_users']), 1, msg="Should be exactly one attending user")
        # the attending user should be user3
        self.assertEqual(decoded_response['attending_users'][0]['pk'], self.user3.pk)

    def test_add_and_delete_attending_user(self):
        """ Tries to add and delete attending users in one api call"""

        # add 2 attending users
        user_pk_list = [self.user1.pk, self.user2.pk]

        response = self.update_attending_users(self.token1, self.meeting1.pk,
                                               user_pk_list,
                                               HTTP_USER_AGENT, REMOTE_ADDR)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # add user3, delete user1, no changes to user2
        user_pk_list = [self.user3.pk, self.user1.pk]

        response = self.update_attending_users(self.token1, self.meeting1.pk,
                                               user_pk_list,
                                               HTTP_USER_AGENT, REMOTE_ADDR)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        decoded_response = json.loads(response.content.decode())
        self.assertEqual(len(decoded_response['attending_users']), 2, msg="Should be exactly two attending users")

    def test_add_and_delete_attending_user_with_two_users(self):
        """ Tries to add and delete attending users with different users at the same time """

        # with user 1
        # add 2 attending users
        user_pk_list = [self.user2.pk, self.user3.pk]

        response = self.update_attending_users(self.token1, self.meeting1.pk,
                                               user_pk_list,
                                               HTTP_USER_AGENT, REMOTE_ADDR)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        decoded_response = json.loads(response.content.decode())
        self.assertEqual(len(decoded_response['attending_users']), 2, msg="Should be exactly two attending users")

        # unlock meeting1 with user1
        response = self.unlock(self.token1, "meetings", self.meeting1.pk, REMOTE_ADDR, HTTP_USER_AGENT)
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # with user 2
        # assign student 2 to the project of student 1 as project manager
        self.validate_assign_user_to_project(self.token1, self.project,
                                             self.user2, self.projectManagerRole, HTTP_USER_AGENT,
                                             REMOTE_ADDR)

        # remove user 3
        user_pk_list = [self.user2.pk]

        response = self.update_attending_users(self.token2, self.meeting1.pk,
                                               user_pk_list,
                                               HTTP_USER_AGENT, REMOTE_ADDR)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        decoded_response = json.loads(response.content.decode())
        self.assertEqual(len(decoded_response['attending_users']), 1, msg="Should be exactly one attending user")
        # the attending user should be user2
        self.assertEqual(decoded_response['attending_users'][0]['pk'], self.user2.pk)

        # unlock meeting1 with user2
        response = self.unlock(self.token2, "meetings", self.meeting1.pk, REMOTE_ADDR, HTTP_USER_AGENT)
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # with user 1
        # remove user2 and add user1
        user_pk_list = [self.user1.pk]

        response = self.update_attending_users(self.token1, self.meeting1.pk,
                                               user_pk_list,
                                               HTTP_USER_AGENT, REMOTE_ADDR)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        decoded_response = json.loads(response.content.decode())
        self.assertEqual(len(decoded_response['attending_users']), 1, msg="Should be exactly one attending user")
        # the attending user should be user1
        self.assertEqual(decoded_response['attending_users'][0]['pk'], self.user1.pk)

    def test_create_attending_contact(self):
        """ Tries to add one attending contact to the meeting """
        contact_pk_list = [str(self.contact1.pk)]

        response = self.update_attending_contacts(self.token1, self.meeting1.pk, contact_pk_list,
                                                  HTTP_USER_AGENT, REMOTE_ADDR)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        decoded_response = json.loads(response.content.decode())
        self.assertEqual(len(decoded_response['attending_contacts']), 1, msg="Should be exactly one attending contact")

    def test_create_attending_contact_with_same_contact(self):
        """ Tries to add the same contacts twice (result: only add once) """
        contact_pk_list = [str(self.contact1.pk), str(self.contact1.pk)]

        response = self.update_attending_contacts(self.token1, self.meeting1.pk, contact_pk_list,
                                                  HTTP_USER_AGENT, REMOTE_ADDR)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        decoded_response = json.loads(response.content.decode())
        self.assertEqual(len(decoded_response['attending_contacts']), 1, msg="Should be exactly one attending contact")

    def test_delete_attending_contact(self):
        """ Tries to delete two attending contacts """

        # add 2 attending contacts
        contact_pk_list = [str(self.contact1.pk), str(self.contact2.pk)]

        response = self.update_attending_contacts(self.token1, self.meeting1.pk, contact_pk_list,
                                                  HTTP_USER_AGENT, REMOTE_ADDR)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # delete contact1
        contact_pk_list = [str(self.contact2.pk)]
        response = self.update_attending_contacts(self.token1, self.meeting1.pk, contact_pk_list,
                                                  HTTP_USER_AGENT, REMOTE_ADDR)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        decoded_response = json.loads(response.content.decode())
        self.assertEqual(len(decoded_response['attending_contacts']), 1, msg="Should be exactly one attending contact")
        # the attending contact should be contact2
        self.assertEqual(decoded_response['attending_contacts'][0]['pk'], str(self.contact2.pk))

    def test_add_and_delete_attending_contact(self):
        """ Tries to add and delete attending contacts in one api call"""

        # add 1 attending contact
        contact_pk_list = [str(self.contact1.pk)]

        response = self.update_attending_contacts(self.token1, self.meeting1.pk,
                                                  contact_pk_list,
                                                  HTTP_USER_AGENT, REMOTE_ADDR)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # add contact2, delete contact1 (by leaving it out)
        contact_pk_list = [str(self.contact2.pk)]

        response = self.update_attending_contacts(self.token1, self.meeting1.pk,
                                                  contact_pk_list,
                                                  HTTP_USER_AGENT, REMOTE_ADDR)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        decoded_response = json.loads(response.content.decode())
        self.assertEqual(len(decoded_response['attending_contacts']), 1, msg="Should be exactly one attending contact")

    def test_add_and_delete_attending_contact_with_two_users(self):
        """ Tries to add and delete attending contacts with different users at the same time """

        # with user 1
        # add 2 attending contacts
        contact_pk_list = [str(self.contact1.pk), str(self.contact2.pk)]

        response = self.update_attending_contacts(self.token1, self.meeting1.pk,
                                                  contact_pk_list,
                                                  HTTP_USER_AGENT, REMOTE_ADDR)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        decoded_response = json.loads(response.content.decode())
        self.assertEqual(len(decoded_response['attending_contacts']), 2, msg="Should be exactly two attending contacts")

        # unlock meeting with user1
        response = self.unlock(self.token1, "meetings", self.meeting1.pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # with user 2
        # assign student 2 to the project of student 1 as project manager
        self.validate_assign_user_to_project(self.token1, self.project,
                                             self.user2, self.projectManagerRole, HTTP_USER_AGENT,
                                             REMOTE_ADDR)
        # remove contact 2
        contact_pk_list = [str(self.contact1.pk)]

        response = self.update_attending_contacts(self.token2, self.meeting1.pk,
                                                  contact_pk_list,
                                                  HTTP_USER_AGENT, REMOTE_ADDR)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        decoded_response = json.loads(response.content.decode())
        self.assertEqual(len(decoded_response['attending_contacts']), 1, msg="Should be exactly one attending contact")
        # the attending contact should be contact1
        self.assertEqual(decoded_response['attending_contacts'][0]['pk'], str(self.contact1.pk))

        # unlock meeting with user2
        response = self.unlock(self.token2, "meetings", self.meeting1.pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # with user 1
        # remove add contact2
        contact_pk_list = [str(self.contact1.pk), str(self.contact2.pk)]

        response = self.update_attending_contacts(self.token1, self.meeting1.pk,
                                                  contact_pk_list,
                                                  HTTP_USER_AGENT, REMOTE_ADDR)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        decoded_response = json.loads(response.content.decode())
        self.assertEqual(len(decoded_response['attending_contacts']), 2, msg="Should be exactly two attending contacts")

    def test_export_meeting(self):
        """
        Tests the export endpoint of /api/meetings/export
        :return:
        """
        response = self.rest_export_meetings(self.token1, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_200_OK)

    def test_current_user_is_always_attending(self):
        """
        Tests that the current user is always attending the meeting he/she created
        :return:
        """
        response = self.rest_create_meeting(self.token1, self.project.pk, "Another meeting",
                                            "Some Text for this meeting",
                                            timezone.now(), timezone.now(), HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_201_CREATED)
        decoded = json.loads(response.content.decode())
        meeting = Meeting.objects.get(pk=decoded['pk'])
        self.assertEquals(meeting.attending_users.all().first().pk, self.user1.pk)
        self.assertEquals(decoded['attending_users_pk'][0], self.user1.pk)

    def test_attending_users_permission(self):
        """
        Tests the permission of attending users (attending users can view the meeting)
        :return:
        """
        # create a new meeting without a project
        response = self.rest_create_meeting(self.token1, None, "Another meeting", "Some Text for this meeting",
                                            timezone.now(), timezone.now(), HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_201_CREATED)
        decoded = json.loads(response.content.decode())

        # there should only be one user assigned (the current user)
        self.assertEquals(len(decoded['attending_users_pk']), 1)
        self.assertEquals(decoded['attending_users_pk'][0], self.user1.pk)

        # try to view the meeting with user2 (should not work)
        response = self.rest_get_meeting(self.token2, decoded['pk'], HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_404_NOT_FOUND)

        # add user2 as an attending user to this meeting
        response = self.update_attending_users(self.token1, self.meeting1.pk,
                                               [self.user1.pk, self.user2.pk],
                                               HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        decoded = json.loads(response.content.decode())

        self.assertEquals(Meeting.objects.filter(pk=decoded['pk']).first().attending_users.all().count(), 2,
                          msg="There should be two attending users")

        # now user2 can view the meeting too!
        response = self.rest_get_meeting(self.token2, decoded['pk'], HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_200_OK)

    def test_meeting_with_invalid_attending_contact(self):
        """ Tries to set an invalid attending contact """
        # add user2 to project
        self.rest_assign_user_to_project(self.token1, self.project, self.user2, self.projectManagerRole,
                                         HTTP_USER_AGENT, REMOTE_ADDR)

        # try to retrieve contact3 with user2 (should not work)
        response = self.rest_get_contact(self.token2, self.contact3.pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_404_NOT_FOUND)

        # user2 tries to remove contacts from meeting1 (should work)
        response = self.update_attending_contacts(self.token2, self.meeting1.pk,
                                                  [],
                                                  HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # user2 tries to set contact3 as an attending contact (which should not work, because user2 has no access to contact3)
        response = self.update_attending_contacts(self.token2, self.meeting1.pk,
                                                  [self.contact1.pk, self.contact2.pk, self.contact3.pk],
                                                  HTTP_USER_AGENT, REMOTE_ADDR)
        decoded = json.loads(response.content.decode())
        # the response should contain that attending_contacts_pk
        self.assertTrue('object does not exist' in str(decoded['attending_contacts_pk']))
        self.assertEquals(response.status_code, status.HTTP_400_BAD_REQUEST)

        # unlock meeting1 with user2
        response = self.unlock(self.token2, "meetings", self.meeting1.pk, REMOTE_ADDR, HTTP_USER_AGENT)
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # however, user1 should be able to do that
        response = self.update_attending_contacts(self.token1, self.meeting1.pk,
                                                  [self.contact1.pk, self.contact2.pk, self.contact3.pk],
                                                  HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # try to retrieve contact3 with user2 (should work now, as contact3 is part of a meeting that user2 has access to)
        response = self.rest_get_contact(self.token2, self.contact3.pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_200_OK)

    def test_create_meeting_with_attending_users_and_contacts(self):
        """ Tries to create a meeting (POST  /api/meetings/) with attending_users and attending_contacts """
        meeting_count = Meeting.objects.count()

        response = self.rest_create_meeting(
            self.token1, None, "Test Meeting", "Test Description",
            timezone.now(), timezone.now() + timedelta(hours=1),
            HTTP_USER_AGENT, REMOTE_ADDR,
            [self.user1.pk, self.user2.pk], [self.contact1.pk, self.contact2.pk]
        )
        decoded_meeting = json.loads(response.content.decode())
        self.assertEquals(response.status_code, status.HTTP_201_CREATED)
        # verify a new meeting has been created in database
        self.assertEquals(Meeting.objects.all().count(), meeting_count + 1)
        meeting = Meeting.objects.filter(pk=decoded_meeting['pk']).first()
        self.assertEquals(meeting.attending_users.count(), 2)
        self.assertEquals(meeting.attending_contacts.count(), 2)

    def test_add_attending_user_to_meeting_twice(self):
        """ Tries to add the same users twice (result: only add once) """
        # create a new meeting with user1 (should work)
        user_pk_list = [self.user2.pk, self.user2.pk]

        response = self.update_attending_users(self.token1, self.meeting1.pk, user_pk_list, HTTP_USER_AGENT,
                                               REMOTE_ADDR)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        decoded_response = json.loads(response.content.decode())
        self.assertEqual(len(decoded_response['attending_users']), 1, msg="Should be exactly one attending user")

    def test_meeting_update_attending_users_without_permission(self):
        """ Tries to update attending users of a meeting without having the proper permission """

        # try with user1 (token1) -> should work
        response = self.update_attending_users(self.token1, self.meeting1.pk, [self.user1.pk], HTTP_USER_AGENT,
                                               REMOTE_ADDR)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # try to remove it again with user2 (token2) -> should not work, as user 2 is not allowed to view the meeting
        response = self.update_attending_users(self.token2, self.meeting1.pk, [], HTTP_USER_AGENT,
                                               REMOTE_ADDR)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

        # give user2 the view privilege for the meeting, by making user2 an attending user
        response = self.update_attending_users(self.token1, self.meeting1.pk, [self.user1.pk, self.user2.pk],
                                               HTTP_USER_AGENT,
                                               REMOTE_ADDR)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # unlock meeting1 with user1
        response = self.unlock(self.token1, "meetings", self.meeting1.pk, REMOTE_ADDR, HTTP_USER_AGENT)
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # now user2 should see the meeting and is allowed to update it (remove all users from meeting)
        response = self.update_attending_users(self.token2, self.meeting1.pk, [], HTTP_USER_AGENT,
                                               REMOTE_ADDR)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # also verify that attending users of this meeting are still set to two
        self.assertEquals(self.meeting1.attending_users.all().count(), 0, msg="there should be zero attending users")

    def test_meeting_update_attending_contacts_without_permission(self):
        """ Tries to update attending contacts of a meeting without having the proper permission """

        # try with user1 (token1) -> should work
        response = self.update_attending_contacts(self.token1, self.meeting1.pk, [self.contact1.pk],
                                                  HTTP_USER_AGENT, REMOTE_ADDR)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.assertEquals(self.meeting1.attending_contacts.all().count(), 1,
                          msg="there should be zero attending contacts")

        # try to remove it again with user2 (token2) -> should not work, as user 2 is not allowed to view the meeting
        response = self.update_attending_contacts(self.token2, self.meeting1.pk, [], HTTP_USER_AGENT,
                                                  REMOTE_ADDR)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

        self.assertEquals(self.meeting1.attending_contacts.all().count(), 1,
                          msg="there should be zero attending contacts")

        # give user2 the view, edit and trash privilege for the meeting, by making user2 an attending user
        response = self.update_attending_users(self.token1, self.meeting1.pk, [self.user1.pk, self.user2.pk],
                                               HTTP_USER_AGENT,
                                               REMOTE_ADDR)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # unlock meeting with user1
        response = self.unlock(self.token1, "meetings", self.meeting1.pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # now user2 should see the meeting and is allowed to update it (remove all users from meeting)
        response = self.update_attending_contacts(self.token2, self.meeting1.pk, [], HTTP_USER_AGENT,
                                                  REMOTE_ADDR)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # also verify that attending users of this meeting are still set to two
        self.assertEquals(self.meeting1.attending_contacts.all().count(), 0,
                          msg="there should be zero attending contacts")
