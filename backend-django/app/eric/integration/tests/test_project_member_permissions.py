#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import json

from rest_framework import status
from rest_framework.test import APITestCase

from django.utils.timezone import datetime, timedelta

from eric.core.tests import HTTP_USER_AGENT, REMOTE_ADDR, test_utils
from eric.core.tests.test_utils import CommonTestMixin
from eric.dmp.models import Dmp, DmpForm, DmpFormField
from eric.dmp.tests.core import DmpsMixin
from eric.drives.models import Drive
from eric.drives.tests.core import DriveMixin
from eric.kanban_boards.models import KanbanBoard
from eric.kanban_boards.tests.core import KanbanBoardMixin
from eric.labbooks.models import LabBook
from eric.labbooks.tests.core import LabBookMixin
from eric.model_privileges.models import ModelPrivilege
from eric.pictures.models import Picture
from eric.pictures.tests.core import PictureMixin
from eric.plugins.models import PluginInstance, Plugin
from eric.plugins.tests.mixins import PluginInstanceMixin
from eric.projects.models import Role, Group, User, Project, Resource
from eric.projects.tests.core import AuthenticationMixin, ProjectsMixin, ModelPrivilegeMixin, ResourceMixin
from eric.shared_elements.models import Task, Note, Meeting, File, Contact
from eric.shared_elements.tests.core import TaskMixin, NoteMixin, MeetingMixin, FileMixin, ContactMixin


class TestProjectMembers(APITestCase, CommonTestMixin, AuthenticationMixin, ProjectsMixin, ModelPrivilegeMixin,
                         TaskMixin, NoteMixin, MeetingMixin, FileMixin, ContactMixin, LabBookMixin, DriveMixin,
                         DmpsMixin, ResourceMixin, PictureMixin, KanbanBoardMixin):

    def setUp(self):
        self.project_member_role = Role.objects.get(name='Project Member')
        self.user_group = Group.objects.get(name='User')

        self.user1 = User.objects.create_user(
            username='student_1', email='student_1@email.com', password='top_secret')
        self.user1.groups.add(self.user_group)

        self.user2 = User.objects.create_user(
            username='student_2', email='student_2@email.com', password='foobar')
        self.user2.groups.add(self.user_group)

        self.token1 = self.login_and_return_token('student_1', 'top_secret')
        self.token2 = self.login_and_return_token('student_2', 'foobar')

        # create a project
        self.project1 = self.create_project(
            self.token1, "My Own Project (user1)",
            "Only user1 has access to this project", Project.STARTED,
            HTTP_USER_AGENT, REMOTE_ADDR
        )

        # add user2 to project1 as a Project Member
        self.rest_assign_user_to_project(
            self.token1, self.project1, self.user2, self.project_member_role,
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

        # create a dmp form
        self.dmp_form = DmpForm.objects.create(title="dmpform1", description="unittest dmpform1")
        # create the dmp form field object
        self.dmp_form_field = DmpFormField.objects.create(name="dmpformfield1", type="NUM",
                                                     infotext="unittest dmpformfield1", dmp_form=self.dmp_form)

        self.data = [
            {
                'title': "Test Task",
                'description': "<p>Some <b>Task</b> Description</p>",
                'project_pks': self.project1.pk,
                'state': Task.TASK_STATE_NEW,
                'priority': Task.TASK_PRIORITY_HIGH,
                'start_date': datetime.now(),
                'due_date': datetime.now() + timedelta(days=1),
                'assigned_user': []
            },
            {
                'subject': "Test Note",
                'content': "<p>Some <b>Note</b> Content</p>",
                'project_pks': self.project1.pk
            },
            {
                'title': "Test Meeting",
                'description': "<p>Some <b>Meeting</b> Description</p>",
                'start_date': datetime.now(),
                'end_date': datetime.now() + timedelta(days=1),
                'project_pks': self.project1.pk
            },
            {
                'file_title': "Test File",
                'file_description': "<p>Some <b>File</b> Description</p>",
                'file_name': "file.txt",
                'file_size': 1024,
                'project_pks': self.project1.pk
            },
            {
                'academic_title': "Dr.",
                'firstname': "Max",
                'lastname': "Mustermann",
                'email': "max@mustermann.name",
                'project_pks': self.project1.pk
            },
            {
                'title': "Test LabBook",
                'is_template': False,
                'project_pks': self.project1.pk
            },
            {
                'title': "Test Drive",
                'project_pks': self.project1.pk
            },
            {
                'dmp_title': "Test DMP",
                'dmp_status': Dmp.NEW,
                'dmp_form_id':  self.dmp_form.pk,
                'projects': self.project1.pk
            },
            {
                'name': "Test Resource",
                'description': "<p>Some <b>Resource</b> Description</p>",
                'resource_type':  Resource.ROOM,
                'user_availability': Resource.GLOBAL,
                'project_pks': self.project1.pk
            },
            {
                'title': "Test Picture",
                'background_img_file_name': "demo1.png",
                'project_pks': self.project1.pk
            },
            {
                'title': "Test KanbanBoard",
                'board_type': KanbanBoard.KANBAN_BOARD_TYPE_PROJECT,
                'project_pks': self.project1.pk
            }
        ]

    def test_task_privileges_for_project_members(self):
        """
        Tests that Project Members get view, edit, trash and restore privileges
        :return:
        """
        # create a new task with user1
        response = self.rest_create_task(self.token1,
                                         HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR, **self.data[0])
        self.assertEquals(response.status_code, status.HTTP_201_CREATED)
        decoded_response = json.loads(response.content.decode())
        task = Task.objects.filter(pk=decoded_response['pk']).first()

        # user2 should see the task
        response = self.rest_get_tasks(self.token2, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_200_OK)
        decoded_list = json.loads(response.content.decode())
        decoded_list = test_utils.get_paginated_results(decoded_list)
        self.assertEquals(len(decoded_list), 1, msg="User 2 should see 1 task")

        # and there should be a view, edit, trash and restore privilege listed for user 2
        response = self.rest_get_privileges(self.token1, "tasks", task.pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_200_OK)
        decoded_privileges = json.loads(response.content.decode())
        self.assertEquals(len(decoded_privileges), 2, msg="There should be two privileges for this task")
        # privilege 0 should be for user1
        self.assertEquals(decoded_privileges[0]['user']['pk'], self.user1.pk)
        # and privilege 1 should be for user2
        self.assertEquals(decoded_privileges[1]['user']['pk'], self.user2.pk)
        # verify that user1 is the owner
        self.assertEquals(decoded_privileges[0]['full_access_privilege'], ModelPrivilege.ALLOW)
        # verify that user2 has view, edit, trash and restore privilege
        self.assertEquals(decoded_privileges[1]['full_access_privilege'], ModelPrivilege.NEUTRAL)
        self.assertEquals(decoded_privileges[1]['view_privilege'], ModelPrivilege.ALLOW)
        self.assertEquals(decoded_privileges[1]['edit_privilege'], ModelPrivilege.ALLOW)
        self.assertEquals(decoded_privileges[1]['delete_privilege'], ModelPrivilege.NEUTRAL)
        self.assertEquals(decoded_privileges[1]['trash_privilege'], ModelPrivilege.ALLOW)
        self.assertEquals(decoded_privileges[1]['restore_privilege'], ModelPrivilege.ALLOW)

    def test_note_privileges_for_project_members(self):
        """
        Tests that Project Members get view, edit, trash and restore privileges
        :return:
        """
        # create a new note with user1
        response = self.rest_create_note(self.token1,
                                         HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR, **self.data[1])
        self.assertEquals(response.status_code, status.HTTP_201_CREATED)
        decoded_response = json.loads(response.content.decode())
        note = Note.objects.filter(pk=decoded_response['pk']).first()

        # user2 should see the note
        response = self.rest_get_notes(self.token2, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_200_OK)
        decoded_list = json.loads(response.content.decode())
        decoded_list = test_utils.get_paginated_results(decoded_list)
        self.assertEquals(len(decoded_list), 1, msg="User 2 should see 1 note")

        # and there should be a view, edit, trash and restore privilege listed for user 2
        response = self.rest_get_privileges(self.token1, "notes", note.pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_200_OK)
        decoded_privileges = json.loads(response.content.decode())
        self.assertEquals(len(decoded_privileges), 2, msg="There should be two privileges for this note")
        # privilege 0 should be for user1
        self.assertEquals(decoded_privileges[0]['user']['pk'], self.user1.pk)
        # and privilege 1 should be for user2
        self.assertEquals(decoded_privileges[1]['user']['pk'], self.user2.pk)
        # verify that user1 is the owner
        self.assertEquals(decoded_privileges[0]['full_access_privilege'], ModelPrivilege.ALLOW)
        # verify that user2 has view, edit, trash and restore privilege
        self.assertEquals(decoded_privileges[1]['full_access_privilege'], ModelPrivilege.NEUTRAL)
        self.assertEquals(decoded_privileges[1]['view_privilege'], ModelPrivilege.ALLOW)
        self.assertEquals(decoded_privileges[1]['edit_privilege'], ModelPrivilege.ALLOW)
        self.assertEquals(decoded_privileges[1]['delete_privilege'], ModelPrivilege.NEUTRAL)
        self.assertEquals(decoded_privileges[1]['trash_privilege'], ModelPrivilege.ALLOW)
        self.assertEquals(decoded_privileges[1]['restore_privilege'], ModelPrivilege.ALLOW)

    def test_meeting_privileges_for_project_members(self):
        """
        Tests that Project Members get view, edit, trash and restore privileges
        :return:
        """
        # create a new meeting with user1
        response = self.rest_create_meeting(self.token1,
                                         HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR, **self.data[2])
        self.assertEquals(response.status_code, status.HTTP_201_CREATED)
        decoded_response = json.loads(response.content.decode())
        meeting = Meeting.objects.filter(pk=decoded_response['pk']).first()

        # user2 should see the meeting
        response = self.rest_get_meetings(self.token2, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_200_OK)
        decoded_list = json.loads(response.content.decode())
        decoded_list = test_utils.get_paginated_results(decoded_list)
        self.assertEquals(len(decoded_list), 1, msg="User 2 should see 1 meeting")

        # and there should be a view, edit, trash and restore privilege listed for user 2
        response = self.rest_get_privileges(self.token1, "meetings", meeting.pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_200_OK)
        decoded_privileges = json.loads(response.content.decode())
        self.assertEquals(len(decoded_privileges), 2, msg="There should be two privileges for this meeting")
        # privilege 0 should be for user1
        self.assertEquals(decoded_privileges[0]['user']['pk'], self.user1.pk)
        # and privilege 1 should be for user2
        self.assertEquals(decoded_privileges[1]['user']['pk'], self.user2.pk)
        # verify that user1 is the owner
        self.assertEquals(decoded_privileges[0]['full_access_privilege'], ModelPrivilege.ALLOW)
        # verify that user2 has view, edit, trash and restore privilege
        self.assertEquals(decoded_privileges[1]['full_access_privilege'], ModelPrivilege.NEUTRAL)
        self.assertEquals(decoded_privileges[1]['view_privilege'], ModelPrivilege.ALLOW)
        self.assertEquals(decoded_privileges[1]['edit_privilege'], ModelPrivilege.ALLOW)
        self.assertEquals(decoded_privileges[1]['delete_privilege'], ModelPrivilege.NEUTRAL)
        self.assertEquals(decoded_privileges[1]['trash_privilege'], ModelPrivilege.ALLOW)
        self.assertEquals(decoded_privileges[1]['restore_privilege'], ModelPrivilege.ALLOW)

    def test_file_privileges_for_project_members(self):
        """
        Tests that Project Members get view, edit, trash and restore privileges
        :return:
        """
        # create a new file with user1
        response = self.rest_create_file(self.token1,
                                         HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR, **self.data[3])
        self.assertEquals(response.status_code, status.HTTP_201_CREATED)
        decoded_response = json.loads(response.content.decode())
        file = File.objects.filter(pk=decoded_response['pk']).first()

        # user2 should see the file
        response = self.rest_get_files(self.token2, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_200_OK)
        decoded_list = json.loads(response.content.decode())
        decoded_list = test_utils.get_paginated_results(decoded_list)
        self.assertEquals(len(decoded_list), 1, msg="User 2 should see 1 file")

        # and there should be a view, edit, trash and restore privilege listed for user 2
        response = self.rest_get_privileges(self.token1, "files", file.pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_200_OK)
        decoded_privileges = json.loads(response.content.decode())
        self.assertEquals(len(decoded_privileges), 2, msg="There should be two privileges for this file")
        # privilege 0 should be for user1
        self.assertEquals(decoded_privileges[0]['user']['pk'], self.user1.pk)
        # and privilege 1 should be for user2
        self.assertEquals(decoded_privileges[1]['user']['pk'], self.user2.pk)
        # verify that user1 is the owner
        self.assertEquals(decoded_privileges[0]['full_access_privilege'], ModelPrivilege.ALLOW)
        # verify that user2 has view, edit, trash and restore privilege
        self.assertEquals(decoded_privileges[1]['full_access_privilege'], ModelPrivilege.NEUTRAL)
        self.assertEquals(decoded_privileges[1]['view_privilege'], ModelPrivilege.ALLOW)
        self.assertEquals(decoded_privileges[1]['edit_privilege'], ModelPrivilege.ALLOW)
        self.assertEquals(decoded_privileges[1]['delete_privilege'], ModelPrivilege.NEUTRAL)
        self.assertEquals(decoded_privileges[1]['trash_privilege'], ModelPrivilege.ALLOW)
        self.assertEquals(decoded_privileges[1]['restore_privilege'], ModelPrivilege.ALLOW)

    def test_contact_privileges_for_project_members(self):
        """
        Tests that Project Members get view, edit, trash and restore privileges
        :return:
        """
        # create a new contact with user1
        response = self.rest_create_contact(self.token1,
                                         HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR, **self.data[4])
        self.assertEquals(response.status_code, status.HTTP_201_CREATED)
        decoded_response = json.loads(response.content.decode())
        contact = Contact.objects.filter(pk=decoded_response['pk']).first()

        # user2 should see the contact
        response = self.rest_get_contacts(self.token2, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_200_OK)
        decoded_list = json.loads(response.content.decode())
        decoded_list = test_utils.get_paginated_results(decoded_list)
        self.assertEquals(len(decoded_list), 1, msg="User 2 should see 1 contact")

        # and there should be a view, edit, trash and restore privilege listed for user 2
        response = self.rest_get_privileges(self.token1, "contacts", contact.pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_200_OK)
        decoded_privileges = json.loads(response.content.decode())
        self.assertEquals(len(decoded_privileges), 2, msg="There should be two privileges for this contact")
        # privilege 0 should be for user1
        self.assertEquals(decoded_privileges[0]['user']['pk'], self.user1.pk)
        # and privilege 1 should be for user2
        self.assertEquals(decoded_privileges[1]['user']['pk'], self.user2.pk)
        # verify that user1 is the owner
        self.assertEquals(decoded_privileges[0]['full_access_privilege'], ModelPrivilege.ALLOW)
        # verify that user2 has view, edit, trash and restore privilege
        self.assertEquals(decoded_privileges[1]['full_access_privilege'], ModelPrivilege.NEUTRAL)
        self.assertEquals(decoded_privileges[1]['view_privilege'], ModelPrivilege.ALLOW)
        self.assertEquals(decoded_privileges[1]['edit_privilege'], ModelPrivilege.ALLOW)
        self.assertEquals(decoded_privileges[1]['delete_privilege'], ModelPrivilege.NEUTRAL)
        self.assertEquals(decoded_privileges[1]['trash_privilege'], ModelPrivilege.ALLOW)
        self.assertEquals(decoded_privileges[1]['restore_privilege'], ModelPrivilege.ALLOW)

    def test_labbook_privileges_for_project_members(self):
        """
        Tests that Project Members get view, edit, trash and restore privileges
        :return:
        """
        # create a new labbook with user1
        response = self.rest_create_labbook(self.token1,
                                         HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR, **self.data[5])
        self.assertEquals(response.status_code, status.HTTP_201_CREATED)
        decoded_response = json.loads(response.content.decode())
        labbook = LabBook.objects.filter(pk=decoded_response['pk']).first()

        # user2 should see the labbook
        response = self.rest_get_labbooks(self.token2, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_200_OK)
        decoded_list = json.loads(response.content.decode())
        decoded_list = test_utils.get_paginated_results(decoded_list)
        self.assertEquals(len(decoded_list), 1, msg="User 2 should see 1 labbook")

        # and there should be a view, edit, trash and restore privilege listed for user 2
        response = self.rest_get_privileges(self.token1, "labbooks", labbook.pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_200_OK)
        decoded_privileges = json.loads(response.content.decode())
        self.assertEquals(len(decoded_privileges), 2, msg="There should be two privileges for this labbook")
        # privilege 0 should be for user1
        self.assertEquals(decoded_privileges[0]['user']['pk'], self.user1.pk)
        # and privilege 1 should be for user2
        self.assertEquals(decoded_privileges[1]['user']['pk'], self.user2.pk)
        # verify that user1 is the owner
        self.assertEquals(decoded_privileges[0]['full_access_privilege'], ModelPrivilege.ALLOW)
        # verify that user2 has view, edit, trash and restore privilege
        self.assertEquals(decoded_privileges[1]['full_access_privilege'], ModelPrivilege.NEUTRAL)
        self.assertEquals(decoded_privileges[1]['view_privilege'], ModelPrivilege.ALLOW)
        self.assertEquals(decoded_privileges[1]['edit_privilege'], ModelPrivilege.ALLOW)
        self.assertEquals(decoded_privileges[1]['delete_privilege'], ModelPrivilege.NEUTRAL)
        self.assertEquals(decoded_privileges[1]['trash_privilege'], ModelPrivilege.ALLOW)
        self.assertEquals(decoded_privileges[1]['restore_privilege'], ModelPrivilege.ALLOW)

    def test_drive_privileges_for_project_members(self):
        """
        Tests that Project Members get view, edit, trash and restore privileges
        :return:
        """
        # create a new drive with user1
        response = self.rest_create_drive(self.token1,
                                         HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR, **self.data[6])
        self.assertEquals(response.status_code, status.HTTP_201_CREATED)
        decoded_response = json.loads(response.content.decode())
        drive = Drive.objects.filter(pk=decoded_response['pk']).first()

        # user2 should see the drive
        response = self.rest_get_drives(self.token2, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_200_OK)
        decoded_list = json.loads(response.content.decode())
        decoded_list = test_utils.get_paginated_results(decoded_list)
        self.assertEquals(len(decoded_list), 1, msg="User 2 should see 1 drive")

        # and there should be a view, edit, trash and restore privilege listed for user 2
        response = self.rest_get_privileges(self.token1, "drives", drive.pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_200_OK)
        decoded_privileges = json.loads(response.content.decode())
        self.assertEquals(len(decoded_privileges), 2, msg="There should be two privileges for this drive")
        # privilege 0 should be for user1
        self.assertEquals(decoded_privileges[0]['user']['pk'], self.user1.pk)
        # and privilege 1 should be for user2
        self.assertEquals(decoded_privileges[1]['user']['pk'], self.user2.pk)
        # verify that user1 is the owner
        self.assertEquals(decoded_privileges[0]['full_access_privilege'], ModelPrivilege.ALLOW)
        # verify that user2 has view, edit, trash and restore privilege
        self.assertEquals(decoded_privileges[1]['full_access_privilege'], ModelPrivilege.NEUTRAL)
        self.assertEquals(decoded_privileges[1]['view_privilege'], ModelPrivilege.ALLOW)
        self.assertEquals(decoded_privileges[1]['edit_privilege'], ModelPrivilege.ALLOW)
        self.assertEquals(decoded_privileges[1]['delete_privilege'], ModelPrivilege.NEUTRAL)
        self.assertEquals(decoded_privileges[1]['trash_privilege'], ModelPrivilege.ALLOW)
        self.assertEquals(decoded_privileges[1]['restore_privilege'], ModelPrivilege.ALLOW)

    def test_dmp_privileges_for_project_members(self):
        """
        Tests that Project Members get view, edit, trash and restore privileges
        :return:
        """
        # create a new dmp with user1
        response = self.rest_create_dmp(self.token1,
                                         HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR, **self.data[7])
        self.assertEquals(response.status_code, status.HTTP_201_CREATED)
        decoded_response = json.loads(response.content.decode())
        dmp = Dmp.objects.filter(pk=decoded_response['pk']).first()

        # user2 should see the dmp
        response = self.rest_get_dmps(self.token2, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_200_OK)
        decoded_list = json.loads(response.content.decode())
        decoded_list = test_utils.get_paginated_results(decoded_list)
        self.assertEquals(len(decoded_list), 1, msg="User 2 should see 1 dmp")

        # and there should be a view, edit, trash and restore privilege listed for user 2
        response = self.rest_get_privileges(self.token1, "dmps", dmp.pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_200_OK)
        decoded_privileges = json.loads(response.content.decode())
        self.assertEquals(len(decoded_privileges), 2, msg="There should be two privileges for this dmp")
        # privilege 0 should be for user1
        self.assertEquals(decoded_privileges[0]['user']['pk'], self.user1.pk)
        # and privilege 1 should be for user2
        self.assertEquals(decoded_privileges[1]['user']['pk'], self.user2.pk)
        # verify that user1 is the owner
        self.assertEquals(decoded_privileges[0]['full_access_privilege'], ModelPrivilege.ALLOW)
        # verify that user2 has view, edit, trash and restore privilege
        self.assertEquals(decoded_privileges[1]['full_access_privilege'], ModelPrivilege.NEUTRAL)
        self.assertEquals(decoded_privileges[1]['view_privilege'], ModelPrivilege.ALLOW)
        self.assertEquals(decoded_privileges[1]['edit_privilege'], ModelPrivilege.ALLOW)
        self.assertEquals(decoded_privileges[1]['delete_privilege'], ModelPrivilege.NEUTRAL)
        self.assertEquals(decoded_privileges[1]['trash_privilege'], ModelPrivilege.ALLOW)
        self.assertEquals(decoded_privileges[1]['restore_privilege'], ModelPrivilege.ALLOW)

    def test_resource_privileges_for_project_members(self):
        """
        Tests that Project Members get view, edit, trash and restore privileges
        :return:
        """
        # create a new resource with user1
        response = self.rest_create_resource(self.token1,
                                         HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR, **self.data[8])
        self.assertEquals(response.status_code, status.HTTP_201_CREATED)
        decoded_response = json.loads(response.content.decode())
        resource = Resource.objects.filter(pk=decoded_response['pk']).first()

        # user2 should see the resource
        response = self.rest_get_resources(self.token2, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_200_OK)
        decoded_list = json.loads(response.content.decode())
        decoded_list = test_utils.get_paginated_results(decoded_list)
        self.assertEquals(len(decoded_list), 1, msg="User 2 should see 1 resource")

        # and there should be a view, edit, trash and restore privilege listed for user 2
        response = self.rest_get_privileges(self.token1, "resources", resource.pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_200_OK)
        decoded_privileges = json.loads(response.content.decode())
        self.assertEquals(len(decoded_privileges), 2, msg="There should be two privileges for this resource")
        # privilege 0 should be for user1
        self.assertEquals(decoded_privileges[0]['user']['pk'], self.user1.pk)
        # and privilege 1 should be for user2
        self.assertEquals(decoded_privileges[1]['user']['pk'], self.user2.pk)
        # verify that user1 is the owner
        self.assertEquals(decoded_privileges[0]['full_access_privilege'], ModelPrivilege.ALLOW)
        # verify that user2 has view, edit, trash and restore privilege
        self.assertEquals(decoded_privileges[1]['full_access_privilege'], ModelPrivilege.NEUTRAL)
        self.assertEquals(decoded_privileges[1]['view_privilege'], ModelPrivilege.ALLOW)
        self.assertEquals(decoded_privileges[1]['edit_privilege'], ModelPrivilege.ALLOW)
        self.assertEquals(decoded_privileges[1]['delete_privilege'], ModelPrivilege.NEUTRAL)
        self.assertEquals(decoded_privileges[1]['trash_privilege'], ModelPrivilege.ALLOW)
        self.assertEquals(decoded_privileges[1]['restore_privilege'], ModelPrivilege.ALLOW)

    def test_picture_privileges_for_project_members(self):
        """
        Tests that Project Members get view, edit, trash and restore privileges
        :return:
        """
        # create a new picture with user1
        response = self.rest_create_picture(self.token1,
                                         HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR, **self.data[9])
        self.assertEquals(response.status_code, status.HTTP_201_CREATED)
        decoded_response = json.loads(response.content.decode())
        picture = Picture.objects.filter(pk=decoded_response['pk']).first()

        # user2 should see the picture
        response = self.rest_get_pictures(self.token2, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_200_OK)
        decoded_list = json.loads(response.content.decode())
        decoded_list = test_utils.get_paginated_results(decoded_list)
        self.assertEquals(len(decoded_list), 1, msg="User 2 should see 1 picture")

        # and there should be a view, edit, trash and restore privilege listed for user 2
        response = self.rest_get_privileges(self.token1, "pictures", picture.pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_200_OK)
        decoded_privileges = json.loads(response.content.decode())
        self.assertEquals(len(decoded_privileges), 2, msg="There should be two privileges for this picture")
        # privilege 0 should be for user1
        self.assertEquals(decoded_privileges[0]['user']['pk'], self.user1.pk)
        # and privilege 1 should be for user2
        self.assertEquals(decoded_privileges[1]['user']['pk'], self.user2.pk)
        # verify that user1 is the owner
        self.assertEquals(decoded_privileges[0]['full_access_privilege'], ModelPrivilege.ALLOW)
        # verify that user2 has view, edit, trash and restore privilege
        self.assertEquals(decoded_privileges[1]['full_access_privilege'], ModelPrivilege.NEUTRAL)
        self.assertEquals(decoded_privileges[1]['view_privilege'], ModelPrivilege.ALLOW)
        self.assertEquals(decoded_privileges[1]['edit_privilege'], ModelPrivilege.ALLOW)
        self.assertEquals(decoded_privileges[1]['delete_privilege'], ModelPrivilege.NEUTRAL)
        self.assertEquals(decoded_privileges[1]['trash_privilege'], ModelPrivilege.ALLOW)
        self.assertEquals(decoded_privileges[1]['restore_privilege'], ModelPrivilege.ALLOW)

    def test_kanbanboard_privileges_for_project_members(self):
        """
        Tests that Project Members get view, edit, trash and restore privileges
        :return:
        """
        # create a new kanbanboard with user1
        response = self.rest_create_kanbanboard(self.token1,
                                         HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR, **self.data[10])
        self.assertEquals(response.status_code, status.HTTP_201_CREATED)
        decoded_response = json.loads(response.content.decode())
        kanbanboard = KanbanBoard.objects.filter(pk=decoded_response['pk']).first()

        # user2 should see the kanbanboard
        response = self.rest_get_kanbanboards(self.token2, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_200_OK)
        decoded_list = json.loads(response.content.decode())
        decoded_list = test_utils.get_paginated_results(decoded_list)
        self.assertEquals(len(decoded_list), 1, msg="User 2 should see 1 kanbanboard")

        # and there should be a view, edit, trash and restore privilege listed for user 2
        response = self.rest_get_privileges(self.token1, "kanbanboards", kanbanboard.pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_200_OK)
        decoded_privileges = json.loads(response.content.decode())
        self.assertEquals(len(decoded_privileges), 2, msg="There should be two privileges for this kanbanboard")
        # privilege 0 should be for user1
        self.assertEquals(decoded_privileges[0]['user']['pk'], self.user1.pk)
        # and privilege 1 should be for user2
        self.assertEquals(decoded_privileges[1]['user']['pk'], self.user2.pk)
        # verify that user1 is the owner
        self.assertEquals(decoded_privileges[0]['full_access_privilege'], ModelPrivilege.ALLOW)
        # verify that user2 has view, edit, trash and restore privilege
        self.assertEquals(decoded_privileges[1]['full_access_privilege'], ModelPrivilege.NEUTRAL)
        self.assertEquals(decoded_privileges[1]['view_privilege'], ModelPrivilege.ALLOW)
        self.assertEquals(decoded_privileges[1]['edit_privilege'], ModelPrivilege.ALLOW)
        self.assertEquals(decoded_privileges[1]['delete_privilege'], ModelPrivilege.NEUTRAL)
        self.assertEquals(decoded_privileges[1]['trash_privilege'], ModelPrivilege.ALLOW)
        self.assertEquals(decoded_privileges[1]['restore_privilege'], ModelPrivilege.ALLOW)
