#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import json
from datetime import datetime, timedelta

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.core.management import call_command

from rest_framework import status
from rest_framework.test import APITestCase

import time_machine

from eric.core.tests import HTTP_USER_AGENT, REMOTE_ADDR
from eric.dmp.models import Dmp, DmpForm
from eric.dmp.tests.core import DmpsMixin
from eric.drives.tests.core import DriveMixin
from eric.labbooks.models import LabBook
from eric.labbooks.tests.core import LabBookMixin
from eric.model_privileges.models import ModelPrivilege
from eric.pictures.models import Picture
from eric.pictures.tests.core import PictureMixin
from eric.projects.models import Project, Resource
from eric.projects.tests.core import (
    AuthenticationMixin,
    MeMixin,
    ModelPrivilegeMixin,
    ProjectsMixin,
    ResourceMixin,
    UserMixin,
)
from eric.shared_elements.models import Contact, File, Meeting, Note, Task
from eric.shared_elements.tests.core import ContactMixin, FileMixin, MeetingMixin, NoteMixin, TaskMixin

User = get_user_model()


class DeleteOrphanDataTest(
    APITestCase,
    AuthenticationMixin,
    UserMixin,
    MeMixin,
    TaskMixin,
    LabBookMixin,
    ContactMixin,
    FileMixin,
    PictureMixin,
    ProjectsMixin,
    ResourceMixin,
    MeetingMixin,
    DriveMixin,
    DmpsMixin,
    NoteMixin,
    ModelPrivilegeMixin,
):
    def setUp(self):
        self.user_group = Group.objects.get(name="User")

        self.testuser1 = User.objects.create_user(
            username="testuser1", email="testuser1@email.com", password="top_secret"
        )
        self.token1 = self.login_and_return_token("testuser1", "top_secret")
        self.testuser1.groups.add(self.user_group)

        self.testuser2 = User.objects.create_user(
            username="testuser2", email="testuser2@email.com", password="other_top_secret"
        )
        self.token2 = self.login_and_return_token("testuser2", "other_top_secret")
        self.testuser2.groups.add(self.user_group)

        response = self.rest_get_user_with_pk(self.token1, self.testuser1.pk, HTTP_USER_AGENT, REMOTE_ADDR)
        cur_user = json.loads(response.content.decode())
        del cur_user["userprofile"]["avatar"]
        cur_user["userprofile"]["anonymized"] = True
        self.rest_put_me(self.token1, json.dumps(cur_user), assert_status=status.HTTP_200_OK)

        self.project1 = self.create_project(
            self.token1, "My Own Project (user1)", "Project Desc", Project.STARTED, HTTP_USER_AGENT, REMOTE_ADDR
        )

        self.project2 = self.create_project(
            self.token2, "Another Project (user2)", "Project Desc", Project.STARTED, HTTP_USER_AGENT, REMOTE_ADDR
        )

        self.file1 = self.rest_create_file(
            self.token1, None, "MyFile", "This is a file!", "MyFileName", 1024, HTTP_USER_AGENT, REMOTE_ADDR
        )

        self.rest_create_task(
            self.token2,
            None,
            "Test Task",
            "Test Description",
            Task.TASK_STATE_NEW,
            Task.TASK_PRIORITY_HIGH,
            datetime.now(),
            datetime.now() + timedelta(days=30),
            self.testuser2.pk,
            HTTP_USER_AGENT,
            REMOTE_ADDR,
        )

        self.rest_create_labbook(self.token2, None, "Test Labbok", False, HTTP_USER_AGENT, REMOTE_ADDR)

        self.rest_create_contact(
            self.token2, None, "Dr.", "John", "Doe", "email@email.com", HTTP_USER_AGENT, REMOTE_ADDR
        )

        self.rest_create_file(
            self.token2, None, "MyFile", "This is a file!", "MyFileName", 1024, HTTP_USER_AGENT, REMOTE_ADDR
        )

    def test_delete_orphan_data(self):
        seven_months_ago = datetime.now() - timedelta(days=210)
        five_months_ago = datetime.now() - timedelta(days=150)

        with time_machine.travel(seven_months_ago, tick=False):
            self.rest_create_task(
                self.token1,
                None,
                "Test Task",
                "Test Description",
                Task.TASK_STATE_NEW,
                Task.TASK_PRIORITY_HIGH,
                datetime.now(),
                datetime.now() + timedelta(days=30),
                self.testuser1.pk,
                HTTP_USER_AGENT,
                REMOTE_ADDR,
            )

            self.rest_create_labbook(self.token1, None, "Test Labbook", False, HTTP_USER_AGENT, REMOTE_ADDR)

            self.rest_create_contact(
                self.token1, None, "Dr.", "John", "Doe", "email@email.com", HTTP_USER_AGENT, REMOTE_ADDR
            )

            # give testuser2 view privileges for the drive
            contact = Contact.objects.filter(created_by=self.testuser1).first()
            response = self.rest_create_privilege(
                self.token1, "contacts", str(contact.pk), self.testuser2.pk, HTTP_USER_AGENT, REMOTE_ADDR
            )
            decoded_privilege = json.loads(response.content.decode())
            decoded_privilege["view_privilege"] = ModelPrivilege.ALLOW
            self.rest_update_privilege(
                self.token1,
                "contacts",
                str(contact.pk),
                self.testuser2.pk,
                decoded_privilege,
                HTTP_USER_AGENT,
                REMOTE_ADDR,
            )

            self.rest_create_file(
                self.token1, None, "Test File", "File Desc", "File Name", 1, HTTP_USER_AGENT, REMOTE_ADDR
            )

            self.rest_create_picture(self.token1, None, "Test Picture", "demo1.png", HTTP_USER_AGENT, REMOTE_ADDR)

            self.rest_create_project(
                auth_token=self.token1,
                project_name="Project Test",
                project_description="<div>Project Desc</div>",
                project_state=Project.STARTED,
                HTTP_USER_AGENT=HTTP_USER_AGENT,
                REMOTE_ADDR=HTTP_USER_AGENT,
            )

            self.rest_create_resource(
                self.token1,
                self.project1.pk,
                "Test Resource",
                "Resource Desc",
                Resource.ROOM,
                Resource.GLOBAL,
                HTTP_USER_AGENT,
                REMOTE_ADDR,
            )

            self.rest_create_meeting(
                self.token1,
                None,
                "Test Meeting",
                "Meeting Desc",
                datetime.now(),
                datetime.now(),
                HTTP_USER_AGENT,
                REMOTE_ADDR,
            )

            self.rest_create_drive(self.token1, None, "Test Drive", HTTP_USER_AGENT, REMOTE_ADDR)

            self.dmp_form = DmpForm.objects.create(title="test dmpform title", description="test dmpform desc")

            self.rest_create_dmp(
                self.token1, None, "Test DMP", Dmp.FINAL, self.dmp_form.pk, HTTP_USER_AGENT, REMOTE_ADDR
            )

            self.rest_create_note(self.token1, None, "Note", "Note Content", HTTP_USER_AGENT, REMOTE_ADDR)

        with time_machine.travel(five_months_ago, tick=False):
            self.rest_create_labbook(self.token1, None, "Test Labbook 2", False, HTTP_USER_AGENT, REMOTE_ADDR)

        self.assertEqual(Task.objects.count(), 2)
        self.assertEqual(LabBook.objects.count(), 3)
        self.assertEqual(Contact.objects.count(), 2)
        self.assertEqual(Picture.objects.count(), 1)
        self.assertEqual(File.objects.count(), 3)
        self.assertEqual(Resource.objects.count(), 1)
        self.assertEqual(Meeting.objects.count(), 1)
        self.assertEqual(Dmp.objects.count(), 1)
        self.assertEqual(Note.objects.count(), 1)
        call_command("deleteorphandata")
        self.assertEqual(Task.objects.count(), 1)
        self.assertEqual(LabBook.objects.count(), 2)
        # Should be 2 because the anonymized user has not the only access to the contact elements
        self.assertEqual(Contact.objects.count(), 2)
        self.assertEqual(Picture.objects.count(), 0)
        self.assertEqual(File.objects.count(), 2)
        self.assertEqual(Resource.objects.count(), 0)
        self.assertEqual(Meeting.objects.count(), 0)
        self.assertEqual(Dmp.objects.count(), 0)
        self.assertEqual(Note.objects.count(), 0)

    def test_delete_trashed_data(self):
        eleven_years_ago = datetime.now() - timedelta(days=11 * 365)

        with time_machine.travel(eleven_years_ago, tick=False):
            response = self.rest_create_task(
                self.token1,
                None,
                "Test Task",
                "Test Description",
                Task.TASK_STATE_NEW,
                Task.TASK_PRIORITY_HIGH,
                datetime.now(),
                datetime.now() + timedelta(days=30),
                self.testuser1.pk,
                HTTP_USER_AGENT,
                REMOTE_ADDR,
            )
            decoded_response = json.loads(response.content.decode())
            self.rest_trash_task(self.token1, decoded_response["pk"], HTTP_USER_AGENT, REMOTE_ADDR)

        self.assertEqual(Task.objects.filter(deleted=True).count(), 1)
        call_command("deleteorphandata")
        self.assertEqual(Task.objects.filter(deleted=True).count(), 0)
