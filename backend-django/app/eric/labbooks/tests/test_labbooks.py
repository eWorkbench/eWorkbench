#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import json

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from rest_framework import status
from rest_framework.status import HTTP_200_OK, HTTP_403_FORBIDDEN, HTTP_201_CREATED
from rest_framework.test import APITestCase

from eric.labbooks.models import LabBook
from eric.labbooks.tests.core import LabBookMixin
from eric.model_privileges.models import ModelPrivilege
from eric.projects.models import Project, Permission, Role
from eric.projects.tests.core import ModelPrivilegeMixin, ProjectsMixin, AuthenticationMixin
from eric.projects.tests.mixin_entity_generic_tests import EntityChangeRelatedProjectTestMixin
from eric.shared_elements.models import File, Note
from eric.shared_elements.tests.core import NoteMixin, FileMixin

User = get_user_model()

HTTP_USER_AGENT = "APITestClient"
REMOTE_ADDR = "127.0.0.1"


class TestGenericsLabBooks(APITestCase, EntityChangeRelatedProjectTestMixin, LabBookMixin, NoteMixin, FileMixin):
    entity = LabBook

    def setUp(self):
        self.superSetUp()

        self.data = [{
            'title': "Captains Log",
            'is_template': False,
            'project_pks': None,
        }, {
            'title': "Experiment 1",
            'is_template': False,
            'project_pks': None,
        }]

        self.http_data = {
            'HTTP_USER_AGENT': HTTP_USER_AGENT,
            'REMOTE_ADDR': REMOTE_ADDR,
        }

    def test_getting_labbook_elements_without_permission(self):
        """
        Tries retrieving labbook elements without having view permission of the labbook
        :return:
        """
        # create a new labbook
        labbook, response = self.create_labbook_orm(self.token1, None, "LabBook 1", False, **self.http_data)

        # get labbook elements with user1 (should work)
        response = self.rest_get_labbook_elements(self.token1, labbook.pk, **self.http_data)
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # now try the same with user2 (should not work)
        response = self.rest_get_labbook_elements(self.token2, labbook.pk, **self.http_data)
        self.assertEquals(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_labbook_elements(self):
        """
        Extensive test that tries adding new elements to a labbook, viewing and editing those elements with a second user
        aswell as re-ordering the elements
        Also removes an element from the labbook
        :return:
        """
        # create a new labbook
        labbook, response = self.create_labbook_orm(self.token1, None, "LabBook 1", False, **self.http_data)

        # create a new note
        note, response = self.create_note_orm(self.token1, None, "Demo Note", "<p>Some note content", **self.http_data)

        # unlock note with user1
        response = self.unlock(self.token1, "notes", note.pk, **self.http_data)
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # add note to labbook
        response = self.rest_add_labbook_element(
            self.token1, labbook.pk, note.get_content_type().id, note.pk, 0, 0, 20, 10, **self.http_data
        )
        self.assertEquals(response.status_code, status.HTTP_201_CREATED)
        decoded_response = json.loads(response.content.decode())
        print(decoded_response)
        labbook_element = decoded_response

        # unlock note with user1 (adding it to a labbook causes the projects to be synced)
        response = self.unlock(self.token1, "notes", note.pk, **self.http_data)
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # verify that decoded response contains several things
        self.assertEquals(decoded_response['lab_book_id'], str(labbook.pk))
        self.assertEquals(decoded_response['position_x'], 0)
        self.assertEquals(decoded_response['position_y'], 0)
        self.assertEquals(decoded_response['width'], 20)
        self.assertEquals(decoded_response['height'], 10)
        self.assertEquals(decoded_response['child_object_content_type'], note.get_content_type().id)
        self.assertEquals(decoded_response['child_object_id'], str(note.pk))

        # verify that this labbook now has one child element
        self.assertEquals(
            LabBook.objects.filter(pk=labbook.pk).first().child_elements.all().count(),
            1
        )

        # fetch child elements via REST API and verify that it contains one child element
        response = self.rest_get_labbook_elements(self.token1, labbook.pk, **self.http_data)
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # decode it
        decoded_list = json.loads(response.content.decode())

        # verify it contains exactly one item
        self.assertEquals(len(decoded_list), 1)

        # create a new file
        response = self.rest_create_file(self.token1, None, "Test", "<p>Desc</p>", "test.txt", 1024, **self.http_data)
        self.assertEquals(response.status_code, status.HTTP_201_CREATED)
        decoded_file = json.loads(response.content.decode())

        # add file to labbook
        response = self.rest_add_labbook_element(
            self.token1, labbook.pk, File.get_content_type().id, decoded_file['pk'], 0, 10, 5, 8, **self.http_data
        )
        self.assertEquals(response.status_code, status.HTTP_201_CREATED)

        # verify that this labbook now has two child element
        self.assertEquals(
            LabBook.objects.filter(pk=labbook.pk).first().child_elements.all().count(),
            2
        )

        # fetch child elements via REST API and verify that it contains one child element
        response = self.rest_get_labbook_elements(self.token1, labbook.pk, **self.http_data)
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # decode it
        decoded_list = json.loads(response.content.decode())

        # verify it contains exactly two items
        self.assertEquals(len(decoded_list), 2)

        # and now try to view the note of the labbook as user2 (should not work)
        response = self.rest_get_note(self.token2, note.pk, **self.http_data)
        self.assertEquals(response.status_code, status.HTTP_404_NOT_FOUND)

        # give user2 the view privilege for this labbook (which should result in user2 being able to view all sub-elements)
        response = self.rest_generic_create_privilege(self.token1, labbook.pk, self.user2.pk)
        self.assertEquals(response.status_code, status.HTTP_201_CREATED)

        response = self.rest_generic_patch_privilege(self.token1, labbook.pk, self.user2.pk, {
            'view_privilege': ModelPrivilege.ALLOW
        })
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # try to view the labbook as user2 (should work)
        response = self.rest_get_labbook(self.token2, labbook.pk, **self.http_data)
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # try to view labbook elements as user2 (should work)
        response = self.rest_get_labbook_elements(self.token2, labbook.pk, **self.http_data)
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # and now try to view the note and the file of this labbook as user2 (should work)
        response = self.rest_get_note(self.token2, note.pk, **self.http_data)
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # try to update the note (should not work, as the user does not have the edit privilege)
        response = self.rest_update_note(self.token2, note.pk, None, "Some other subject", "some other content",
                                         **self.http_data)
        self.assertEquals(response.status_code, status.HTTP_403_FORBIDDEN)

        # give user2 the edit privilege on the labbook
        response = self.rest_generic_patch_privilege(self.token1, labbook.pk, self.user2.pk, {
            'edit_privilege': ModelPrivilege.ALLOW
        })
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        response = self.rest_update_note(self.token2, note.pk, None, "Some other subject", "some other content",
                                         **self.http_data)
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # now remove the edit privilege of user2 (set to neutral)
        response = self.rest_generic_patch_privilege(self.token1, labbook.pk, self.user2.pk, {
            'edit_privilege': ModelPrivilege.NEUTRAL
        })
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # try to update the note (should not work, as the user does not have the edit privilege)
        response = self.rest_update_note(self.token2, note.pk, None, "Some other subject", "some other content",
                                         **self.http_data)
        self.assertEquals(response.status_code, status.HTTP_403_FORBIDDEN)

        # let user1 remove the note from the labbook
        response = self.rest_remove_labbook_element(self.token1, labbook.pk, labbook_element['pk'], **self.http_data)
        self.assertEquals(response.status_code, status.HTTP_204_NO_CONTENT)

        # get all elements of the labook (should only contain one item)
        response = self.rest_get_labbook_elements(self.token1, labbook.pk, **self.http_data)
        self.assertEquals(response.status_code, status.HTTP_200_OK)
        decoded_response = json.loads(response.content.decode())
        self.assertEquals(len(decoded_response), 1, msg="There should be one element in the labbook")

    def test_labbook_change_projects_changes_projects_of_all_child_elements(self):
        """
        Tests that changing the projects of a labbook also changes the projects of all child elements
        :return:
        """
        # create a new project
        project1 = self.create_project(self.token1, "My First Project", "Some description", Project.STARTED,
                                       **self.http_data)
        project2 = self.create_project(self.token1, "My Second Project", "Another description", Project.STARTED,
                                       **self.http_data)

        # create a new labbook
        labbook, response = self.create_labbook_orm(self.token1, project1.pk, "LabBook 1", False, **self.http_data)

        # create a new note
        note, response = self.create_note_orm(self.token1, None, "Demo Note", "<p>Some note content", **self.http_data)

        # note should not be in any project
        self.assertEquals(len(note.projects.all()), 0, msg="Note should not be in any project")

        # add note to labbook
        response = self.rest_add_labbook_element(
            self.token1, labbook.pk, note.get_content_type().id, note.pk, 0, 0, 20, 10, **self.http_data
        )
        self.assertEquals(response.status_code, status.HTTP_201_CREATED)
        decoded_response = json.loads(response.content.decode())
        print(decoded_response)

        note.refresh_from_db()

        # adding a note to the labbook should already ensure that the note is within the same projects as the labbook
        self.assertEquals(len(note.projects.all()), 1)

        self.assertEquals(note.projects.all().first().pk, project1.pk)

        # now update the project of the labbook
        response = self.rest_update_labbook_project(self.token1, labbook.pk, [project1.pk, project2.pk],
                                                    **self.http_data)
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # update note
        note.refresh_from_db()

        note_projects = note.projects.all()

        # there should be two projects
        self.assertEquals(len(note_projects), 2)

        # should be project1 and project2
        self.assertEquals(note_projects[0].pk, project1.pk)
        self.assertEquals(note_projects[1].pk, project2.pk)

        # now remove project1 from the labbook
        response = self.rest_update_labbook_project(self.token1, labbook.pk, [project2.pk], **self.http_data)
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # update note
        note.refresh_from_db()

        note_projects = note.projects.all()

        # there should be one project
        self.assertEquals(len(note_projects), 1)

        # which should be project2
        self.assertEquals(note_projects[0].pk, project2.pk)


class CreateNoteInLabbookPermissionTest(
    APITestCase, ProjectsMixin, ModelPrivilegeMixin, LabBookMixin, NoteMixin, AuthenticationMixin):
    """
    Tests for bug ticket-276725 where a user without write-access could create notes in labbooks.
    """

    def setUp(self):
        self.observer_role = Role.objects.filter(name="Observer").first()
        self.pm_role = Role.objects.filter(default_role_on_project_create=True).first()

        self.user_group = Group.objects.get(name='User')

        self.user1 = User.objects.create_user(
            username='student_1', email='student_1@email.com', password='top_secret')
        self.user1.groups.add(self.user_group)

        self.user2 = User.objects.create_user(
            username='student_2', email='student_2@email.com', password='foobar')
        self.user2.groups.add(self.user_group)

        self.token1 = self.login_and_return_token('student_1', 'top_secret')
        self.token2 = self.login_and_return_token('student_2', 'foobar')

        self.http_data = {
            'HTTP_USER_AGENT': HTTP_USER_AGENT,
            'REMOTE_ADDR': REMOTE_ADDR,
        }

        self.note_content_type_id = Note.get_content_type().id

        self.note_view_permission = Permission.objects.filter(
            codename='add_note',
            content_type=Note.get_content_type()
        ).first()

        # pre-requisite for this test: the user group must have the create note permission
        self.user_group.permissions.add(self.note_view_permission)

    def test_project_observer_can_not_create_note_in_labbook(self):
        # user1
        # - creates project A and sub project B
        # - assigns user2 as observer to project A
        # - creates labbook in project A
        # - creates a note in the labbook
        # - unlocks the labbook
        # (should work)
        project_a, project_b = self.create_project_a_and_sub_project_b(self.token1)
        self.assign_user_as_observer_to_project(self.token1, self.user2, project_a)
        labbook = self.create_labbook_in_project(self.token1, project_a)
        note_of_user1 = self.create_note_in_labbook(self.token1, labbook, 0, 0)
        self.unlock_labbook(self.token1, labbook)

        self.assert_user_has_only_view_privilege_on_labbook(self.token1, self.user2, labbook)
        self.assert_user_has_only_view_privilege_on_note(self.token1, self.user2, note_of_user1)

        # user2:
        # - creates note (works)
        # - adds the note to the labbook (should fail)
        note_of_user2 = self.create_note(self.token2)
        self.assert_user_can_not_add_note_to_labbook(self.token2, labbook, note_of_user2, 0, 100)

        # double check that this labbook still only has a single element
        self.assert_labbook_has_only_one_element(self.token2, labbook)

    def test_project_observer_can_not_create_note_in_labbook_in_sub_project(self):
        # user1
        # - creates project A and sub project B
        # - assigns user2 as observer to project A
        # - creates labbook in sub project B
        # - creates a note in the labbook
        # - unlocks the labbook
        # (should work)
        project_a, project_b = self.create_project_a_and_sub_project_b(self.token1)
        self.assign_user_as_observer_to_project(self.token1, self.user2, project_a)
        labbook = self.create_labbook_in_project(self.token1, project_b)
        note_of_user1 = self.create_note_in_labbook(self.token1, labbook, 0, 0)
        self.unlock_labbook(self.token1, labbook)

        self.assert_user_has_only_view_privilege_on_labbook(self.token2, self.user2, labbook)
        self.assert_user_has_only_view_privilege_on_note(self.token2, self.user2, note_of_user1)

        # user2:
        # - creates note (works)
        # - adds the note to the labbook (should fail)
        note_of_user2 = self.create_note(self.token2)
        self.assert_user_can_not_add_note_to_labbook(self.token2, labbook, note_of_user2, 0, 100)

        # double check that this labbook still only has a single element
        self.assert_labbook_has_only_one_element(self.token2, labbook)

    def test_user_with_read_access_can_not_create_note_in_labbook_without_project(self):
        # user1:
        # - creates labbook (without project)
        # - grants view-access to user2 on the labbook
        # - unlocks the labbook
        # (should work)
        labbook = self.create_labbook_without_project(self.token1)
        note_of_user1 = self.create_note_in_labbook(self.token1, labbook, 0, 0)
        self.grant_view_access_for_user_to_labbook(self.token1, self.user2, labbook)
        self.unlock_labbook(self.token1, labbook)

        self.assert_user_has_only_view_privilege_on_labbook(self.token2, self.user2, labbook)
        self.assert_user_has_only_view_privilege_on_note(self.token2, self.user2, note_of_user1)

        # user2:
        # - creates note (works)
        # - adds the note to the labbook (should fail)
        note = self.create_note(self.token2)
        self.assert_user_can_not_add_note_to_labbook(self.token2, labbook, note, 0, 100)

        # double check that this labbook still only has a single element
        self.assert_labbook_has_only_one_element(self.token2, labbook)

    def assert_labbook_has_only_one_element(self, token, labbook):
        response = self.rest_get_labbook_elements(token, labbook.pk, **self.http_data)
        labbook_elements = json.loads(response.content.decode())
        self.assertEqual(len(labbook_elements), 1)

    def assert_only_view_privilege(self, privilege):
        self.assertEquals(privilege['view_privilege'], ModelPrivilege.ALLOW)
        self.assertEquals(privilege['edit_privilege'], ModelPrivilege.NEUTRAL)
        self.assertEquals(privilege['full_access_privilege'], ModelPrivilege.NEUTRAL)
        self.assertEquals(privilege['delete_privilege'], ModelPrivilege.NEUTRAL)
        self.assertEquals(privilege['trash_privilege'], ModelPrivilege.NEUTRAL)
        self.assertEquals(privilege['restore_privilege'], ModelPrivilege.NEUTRAL)

    def assert_user_has_only_view_privilege_on_labbook(self, token, user, labbook):
        response = self.rest_get_privileges_for_user(
            token,
            'labbooks', labbook.pk, user.pk,
            **self.http_data
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        privilege = json.loads(response.content.decode())
        self.assert_only_view_privilege(privilege)

    def assert_user_has_only_view_privilege_on_note(self, token, user, note):
        response = self.rest_get_privileges_for_user(
            token,
            'notes', note.pk, user.pk,
            **self.http_data
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        privilege = json.loads(response.content.decode())
        self.assert_only_view_privilege(privilege)

    def assert_user_can_not_add_note_to_labbook(self, token, labbook, note, x, y):
        response = self.rest_add_labbook_element(
            token,
            labbook.pk,
            self.note_content_type_id, note.pk, x, y, 100, 100,
            **self.http_data
        )
        self.assertEqual(response.status_code, HTTP_403_FORBIDDEN)

    def grant_view_access_for_user_to_labbook(self, token, user, labbook):
        response = self.rest_create_privilege(
            token,
            'labbooks', labbook.pk, user.pk,
            **self.http_data
        )
        self.assertEqual(response.status_code, HTTP_201_CREATED)

        privilege = {
            'view_privilege': ModelPrivilege.ALLOW
        }
        response = self.rest_patch_privilege(
            token,
            'labbooks', labbook.pk, user.pk, privilege,
            **self.http_data
        )
        self.assertEqual(response.status_code, HTTP_200_OK)

    def create_note(self, token):
        note, response = self.create_note_orm(
            token,
            None, 'Note Title', 'Note Text',
            **self.http_data
        )
        self.assertEqual(response.status_code, HTTP_201_CREATED)
        return note

    def create_note_in_labbook(self, token, labbook, x, y):
        note = self.create_note(token)

        # note should not have a project pk
        self.assertEqual(len(note.projects.all()), 0)

        response = self.rest_add_labbook_element(
            token,
            labbook.pk,
            self.note_content_type_id, note.pk, x, y, 100, 100,
            **self.http_data
        )
        self.assertEqual(response.status_code, HTTP_201_CREATED)

        # by adding the note to the labbook, the note should get the project pk of the labbook.project
        note.refresh_from_db()
        self.assertEqual(
            list(note.projects.all().values_list('pk', flat=True)),
            list(labbook.projects.all().values_list('pk', flat=True)),
            msg="Note should have the same projects as the LabBook"
        )

        return note

    def create_project_a_and_sub_project_b(self, token):
        project_a = self.create_project(
            token,
            "Project A", "Description A", Project.STARTED,
            **self.http_data
        )
        project_b = self.create_project(
            token,
            "Project B = Sub Project of A", "Description B", Project.STARTED,
            **self.http_data
        )
        response = self.rest_set_parent_project(self.token1, project=project_b, parent=project_a)
        self.assertEqual(response.status_code, HTTP_200_OK)

        return project_a, project_b

    def assign_user_as_observer_to_project(self, token, user, project):
        response = self.rest_assign_user_to_project(
            token,
            project, user, self.observer_role,
            **self.http_data
        )
        self.assertEqual(response.status_code, HTTP_201_CREATED, response.content.decode())

    def create_labbook_in_project(self, token, project):
        labbook, response = self.create_labbook_orm(
            token,
            project.pk, "LabBook in sub project B", False,
            **self.http_data
        )
        self.assertEqual(response.status_code, HTTP_201_CREATED)
        return labbook

    def create_labbook_without_project(self, token):
        labbook, response = self.create_labbook_orm(
            token,
            None, "LabBook", False,
            **self.http_data
        )
        self.assertEqual(response.status_code, HTTP_201_CREATED)
        return labbook

    def unlock_labbook(self, token, labbook):
        response = self.unlock(
            token,
            'labbooks', labbook.pk,
            **self.http_data
        )
        self.assertEqual(response.status_code, HTTP_200_OK)
