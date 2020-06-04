#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import json
from django.core.exceptions import ValidationError
from django.contrib.auth.models import Group
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Permission
from django.utils.timezone import datetime, timedelta

from rest_framework.test import APITestCase
from rest_framework import status

from eric.core.tests import test_utils
from eric.projects.models import Project, ProjectRoleUserAssignment, Role
from eric.shared_elements.models import Note
from eric.projects.tests.core import AuthenticationMixin, UserMixin, ProjectsMixin
from eric.shared_elements.tests.core import NoteMixin

User = get_user_model()

# read http://www.django-rest-framework.org/api-guide/testing/ for more info about testing with django rest framework

HTTP_USER_AGENT = "APITestClient"
REMOTE_ADDR = "127.0.0.1"


class NotesTest(APITestCase, AuthenticationMixin, UserMixin, NoteMixin, ProjectsMixin):
    """
    Tests the /api/notes endpoint
    Tests for creating, retrieving and updateing Notes
    Tests for Notes that are project-related and not project-related (permissions)
    """

    def setUp(self):
        """ Set up a couple of users and roles and projects """
        self.student_role = self.create_student_role()

        self.pm_role = Role.objects.filter(default_role_on_project_create=True).first()

        self.user_group = Group.objects.get(name='User')

        # get add_note and add_note_without_project permission
        self.add_note_permission = Permission.objects.filter(
            codename='add_note',
            content_type=Note.get_content_type()
        ).first()

        self.add_note_without_project_permission = Permission.objects.filter(
            codename='add_note_without_project',
            content_type=Note.get_content_type()
        ).first()

        self.user1 = User.objects.create_user(
            username='student_1', email='student_1@email.com', password='top_secret')
        self.token1 = self.login_and_return_token('student_1', 'top_secret')
        self.user1.groups.add(self.user_group)

        self.user2 = User.objects.create_user(
            username='student_2', email='student_2@email.com', password='foobar')
        self.token2 = self.login_and_return_token('student_2', 'foobar')
        self.user2.groups.add(self.user_group)

        # create a user without any special permissions
        self.user3 = User.objects.create_user(
            username='student_3', email='student_3@email.com', password='permission'
        )
        self.token3 = self.login_and_return_token('student_3', 'permission')

        # create two projects
        self.project1 = self.create_project(
            self.token1, "My Own Project (user1)",
            "Only user1 has access to this project", Project.STARTED,
            HTTP_USER_AGENT, REMOTE_ADDR
        )

        self.project2 = self.create_project(
            self.token2, "Another Project (user2)",
            "Only user2 has access to this project", Project.STARTED,
            HTTP_USER_AGENT, REMOTE_ADDR
        )

        # add user3 to project1
        response = self.rest_assign_user_to_project(
            self.token1, self.project1, self.user3, self.pm_role,
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )
        self.assertEquals(response.status_code, status.HTTP_201_CREATED)

    def test_create_note_with_and_without_permission(self):
        """
        Tests creating a note with and without the appropriate permission
        :return:
        """
        # there should be zero Notes to begin with
        self.assertEquals(Note.objects.all().count(), 0, msg="There should be zero Notes to begin with")

        # try creating a note without a project and without having the proper permission
        response = self.rest_create_note(self.token3, None, "Test Note", "Test Description",
                                         HTTP_USER_AGENT, REMOTE_ADDR)
        decoded = json.loads(response.content.decode())
        self.assertIn(response.status_code, [status.HTTP_403_FORBIDDEN, status.HTTP_400_BAD_REQUEST])

        # there should still be zero Notes
        self.assertEquals(Note.objects.all().count(), 0, msg="There should still be zero Notes")

        # however, creating a note for a project1 should work, as user1 has created project1 (and therefore should have
        # the needed permissions)
        response = self.rest_create_note(self.token3, self.project1.pk, "Test Note", "Test Description",
                                         HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # at the same time, user1 should NOT be able to create a project for project2
        response = self.rest_create_note(self.token3, self.project2.pk,
                                         "Test Note", "Test Description",
                                         HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertIn(response.status_code, [status.HTTP_400_BAD_REQUEST, status.HTTP_403_FORBIDDEN])

        # there should only be one note
        self.assertEquals(Note.objects.all().count(), 1, msg="There should be one note")

        # now give the user the global add_note permission
        self.user3.user_permissions.add(self.add_note_without_project_permission)

        # try creating a note without a project now, and it should work
        response = self.rest_create_note(self.token3, None,
                                         "Test Note", "Test Description",
                                         HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # there should now be two Notes
        self.assertEquals(Note.objects.all().count(), 2, msg="There should be two Notes in the database")

        # and those two should be viewable by the current user
        response = self.rest_get_notes(self.token3, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # check the response
        decoded = json.loads(response.content.decode())
        decoded = test_utils.get_paginated_results(decoded)
        # should contain exactly no Notes
        self.assertEqual(len(decoded), 2, msg="There should be two Notes viewable by the user")

        # revoke add_note_permission of user
        self.user3.user_permissions.remove(self.add_note_permission)
        # and give the user the add_note_without_project permission
        self.user3.user_permissions.add(self.add_note_without_project_permission)

        # try creating a note without a project now, and it should work
        response = self.rest_create_note(self.token3, None,
                                         "Test Note", "Test Description",
                                         HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # there should now be three Notes
        self.assertEquals(Note.objects.all().count(), 3, msg="There should be three Notes in the database")

        # and those two should be viewable by the current user
        response = self.rest_get_notes(self.token3, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # check the response
        decoded = json.loads(response.content.decode())
        decoded = test_utils.get_paginated_results(decoded)
        # should contain exactly no Notes
        self.assertEqual(len(decoded), 3, msg="There should be three Notes viewable by the user")

    def test_get_notes_with_filter(self):
        """
        Tests creating and retrieving Notes that are not associated to a project
        :return:
        """

        # add permission for creating Notes to the current user
        self.user1.user_permissions.add(self.add_note_without_project_permission)

        # there should be zero Notes
        self.assertEquals(Note.objects.all().count(), 0, msg="There should be zero Notes to begin with")

        # get all existing Notes (there should be zero Notes)
        response = self.rest_get_notes(self.token1, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # check the response
        decoded = json.loads(response.content.decode())
        decoded = test_utils.get_paginated_results(decoded)
        # should contain exactly no Notes
        self.assertEqual(len(decoded), 0, msg="/Notes/ endpoint should return zero Notes")

        # try to query the same endpoint with a project_pk (should still be zero Notes)
        response = self.rest_get_notes_for_project(self.token1, self.project1.pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # check the response
        decoded = json.loads(response.content.decode())
        decoded = test_utils.get_paginated_results(decoded)
        # should contain exactly no Notes
        self.assertEqual(len(decoded), 0, msg="/Notes/?project=1234-abcd endpoint should return zero Notes")

        # create a note without depending on a project
        response = self.rest_create_note(self.token1, None, "Test Note", "Test Description",
                                         HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # decode response
        decoded = json.loads(response.content.decode())
        # get note object from db
        note = Note.objects.get(pk=decoded['pk'])
        # verify that the note object was stored and returned properly
        self.assertEquals(decoded['pk'], str(note.pk))
        self.assertEquals(decoded['subject'], "Test Note")
        self.assertEqual(note.subject, "Test Note")

        ########
        # create a note for project1
        ########
        response = self.rest_create_note(self.token1, self.project1.pk, "Test Note", "Test Description",
                                         HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # decode response
        decoded = json.loads(response.content.decode())
        # get note object from db
        note = Note.objects.get(pk=decoded['pk'])
        # verify that the note object was stored and returned properly
        self.assertEquals(decoded['pk'], str(note.pk))
        self.assertEquals(decoded['subject'], "Test Note")
        self.assertEqual(note.subject, "Test Note")

        ########
        # create a note for project2 (should not work, as user1 does not have access to project2)
        ########
        response = self.rest_create_note(self.token1, self.project2.pk,
                                         "Test Note", "Test Description",
                                         HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertIn(response.status_code, [status.HTTP_403_FORBIDDEN, status.HTTP_400_BAD_REQUEST])

        # there should still only be two Notes in the database
        self.assertEquals(Note.objects.all().count(), 2, msg="There should be two Notes")

        # and there should be two Notes "viewable" by the current user
        response = self.rest_get_notes(self.token1, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # check the response
        decoded = json.loads(response.content.decode())
        decoded = test_utils.get_paginated_results(decoded)
        # should contain exactly no Notes
        self.assertEqual(len(decoded), 2, msg="There should be two Notes viewable by the user")

        # and also three Notes returned from the endpoint
        response = self.rest_get_notes(self.token1, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # check the response
        decoded = json.loads(response.content.decode())
        decoded = test_utils.get_paginated_results(decoded)
        # should contain exactly no Notes
        self.assertEqual(len(decoded), 2, msg="/Notes/ endpoint should return two Notes")

    def test_user_can_only_see_Notes_created_by_own_user(self):
        """
        Tests whether the user can only see Notes created by the own user, not by other users
        :return:
        """
        # add permission for creating Notes to user1
        self.user1.user_permissions.add(self.add_note_without_project_permission)

        # add permission for creating Notes to user2
        self.user2.user_permissions.add(self.add_note_without_project_permission)

        # there should be zero Notes
        self.assertEquals(Note.objects.all().count(), 0, msg="There should be zero Notes to begin with")

        # try creating a note without a project for user1 (token1)
        response = self.rest_create_note(self.token1, None,
                                         "Test Note", "Test Description",
                                         HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # try creating a note without a project for user2 (token2)
        response = self.rest_create_note(self.token2, None,
                                         "Test Note", "Test Description",
                                         HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # there should be two Notes
        self.assertEqual(Note.objects.all().count(), 2, msg="There should be two Notes")

        # try quering the rest endpoint for user1 - there should only be one note
        response = self.rest_get_notes(self.token1, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # check the response
        decoded = json.loads(response.content.decode())
        decoded = test_utils.get_paginated_results(decoded)
        # should contain exactly no Notes
        self.assertEqual(len(decoded), 1, msg="There should only be one note visible for user1")

        # try quering the rest endpoint for user2 - there should only be one note
        response = self.rest_get_notes(self.token2, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # check the response
        decoded = json.loads(response.content.decode())
        decoded = test_utils.get_paginated_results(decoded)
        # should contain exactly no Notes
        self.assertEqual(len(decoded), 1, msg="There should only be one note visible for user2")

    def test_create_and_get_notes(self):
        """ Test getting all users and finding specific users """
        project = self.create_project(self.token1, "My Own Project", "Nobody else has access to this project",
                                      Project.STARTED, HTTP_USER_AGENT, REMOTE_ADDR)

        # get all Notes from rest api for this project
        response = self.rest_get_notes_for_project(self.token1, project.pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # check the response
        decoded = json.loads(response.content.decode())
        decoded = test_utils.get_paginated_results(decoded)
        # should contain exactly no Notes
        self.assertEqual(len(decoded), 0)

        # create a note
        note, response = self.create_note_orm(self.token1, project.pk, "Test Note", "Test Description",
                                              HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        self.assertEqual(note.subject, "Test Note")

        # get all Notes from rest api for this project
        response = self.rest_get_notes_for_project(self.token1, project.pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # check the response
        decoded = json.loads(response.content.decode())
        decoded = test_utils.get_paginated_results(decoded)

        # should contain exactly one Notes
        self.assertEqual(len(decoded), 1)

        # create another note
        response = self.rest_create_note(self.token1, project.pk, "Another Test Note", "Another Test Description",
                                         HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # get all Notes from rest api for this project
        response = self.rest_get_notes_for_project(self.token1, project.pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # check the response
        decoded = json.loads(response.content.decode())
        decoded = test_utils.get_paginated_results(decoded)

        # should contain exactly two Notes
        self.assertEqual(len(decoded), 2)

        # update first note
        response = self.rest_update_note(self.token1, note.pk, project.pk, "Test Note Title", "Test Note Description",
                                         HTTP_USER_AGENT, REMOTE_ADDR)
        decoded = json.loads(response.content.decode())
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # get note object from db
        note = Note.objects.get(pk=decoded['pk'])
        self.assertEqual(note.subject, "Test Note Title")

    def test_create_and_edit_of_own_note(self):
        """ Tests creating and editing of a note with the same user (should work) and with a different user
        (which should not work)
        """
        # add permission for creating Notes to the current user
        self.user1.user_permissions.add(self.add_note_without_project_permission)

        # there should be zero Notes to begin with
        self.assertEquals(Note.objects.all().count(), 0, msg="There should be zero Notes to begin with")

        # try creating a note without a project
        note, response = self.create_note_orm(self.token1, None, "Test Note", "Test Description",
                                              HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # there should now be one note
        self.assertEquals(Note.objects.all().count(), 1, msg="There should be one note in the database")

        # try edit this note with user1
        response = self.rest_update_note(self.token1, note.pk, None, "Test Note", "Test Description", HTTP_USER_AGENT,
                                         REMOTE_ADDR)

        decoded = json.loads(response.content.decode())
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # try reading infos about this note with user2 (should not work)
        response = self.rest_get_note(self.token2, decoded['pk'], HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

        # try updating this note with user2 (should also not work)
        response = self.rest_update_note(self.token2, decoded['pk'], None, "Test Note", "Test Description",
                                         HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

