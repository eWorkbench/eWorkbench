#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import json

from django.conf import settings
from django.contrib.auth.models import Group
from django.contrib.auth import get_user_model
from django.test import override_settings
from django.utils.timezone import datetime, timedelta
from django.utils import timezone

from rest_framework.test import APITestCase
from rest_framework import status

from eric.dmp.models import DmpForm
from eric.dmp.tests.core import DmpsMixin
from eric.drives.tests.core import DriveMixin
from eric.kanban_boards.models import KanbanBoard
from eric.kanban_boards.tests.core import KanbanBoardMixin
from eric.metadata.models.models import MetadataField, Metadata
from eric.pictures.tests.core import PictureMixin
from eric.shared_elements.models import Task, Project
from eric.projects.tests.core import AuthenticationMixin, UserMixin, ProjectsMixin
from eric.labbooks.tests.core import LabBookMixin
from eric.shared_elements.tests.core import TaskMixin, ContactMixin, FileMixin, NoteMixin, MeetingMixin
from eric.core.models.abstract import WorkbenchEntityMixin, get_all_workbench_models
from eric.versions.models.models import Version
from eric.versions.tests import VersionData
from eric.versions.tests.rest_mixin import HttpInfo, VersionRestMixin

User = get_user_model()

# read http://www.django-rest-framework.org/api-guide/testing/ for more info about testing with django rest framework

HTTP_USER_AGENT = "APITestClient"
REMOTE_ADDR = "127.0.0.1"
EXPECTED_NUMBER_OF_WORKBENCH_RECORDS = 48


class CleanDatabaseTest(
    APITestCase,
    AuthenticationMixin,
    UserMixin,
    ProjectsMixin,
    LabBookMixin,
    TaskMixin,
    ContactMixin,
    FileMixin,
    NoteMixin,
    MeetingMixin,
    KanbanBoardMixin,
    PictureMixin,
    DmpsMixin,
    DriveMixin,
    VersionRestMixin
):
    """
    Tests if deletion of workbench models does not work
    when settings.CLEAN_ALL_WORKBENCH_MODELS is false or does not exist

    Tests for deletion of workbench models when settings.CLEAN_ALL_WORKBENCH_MODELS is true
    """

    def setUp(self):
        """ Set up a user, projects and shared elements"""

        self.user_group = Group.objects.get(name='User')

        self.testuser1 = User.objects.create_user(
            username='testuser1', email='testuser1@email.com', password='top_secret'
        )
        self.token1 = self.login_and_return_token('testuser1', 'top_secret')
        self.testuser1.groups.add(self.user_group)

        # second user to verify testuser1 can delete objects owned by a second user
        self.testuser2 = User.objects.create_user(
            username='testuser2', email='testuser2@email.com', password='other_top_secret'
        )
        self.token2 = self.login_and_return_token('testuser2', 'other_top_secret')
        self.testuser2.groups.add(self.user_group)

        # create some elements outside of a project
        self.standalone_task1 = self.rest_create_task(self.token1, None, "Standalone Test Task", "Test Description",
                                                      Task.TASK_STATE_NEW, Task.TASK_PRIORITY_HIGH, datetime.now(),
                                                      datetime.now() + timedelta(days=30),
                                                      self.testuser1.pk, HTTP_USER_AGENT, REMOTE_ADDR)

        self.http_info_sa_task1 = HttpInfo(auth_token=self.token1,
                                           user_agent=HTTP_USER_AGENT, remote_address=REMOTE_ADDR)
        self.sa_task1_pk = self.standalone_task1.data['pk']
        self.sa_task1_versiondata = VersionData(object_id=self.sa_task1_pk, summary="My version").as_dict()
        self.standalone_task1_version = self.rest_post_version('tasks', self.sa_task1_pk, self.sa_task1_versiondata,
                                                               self.http_info_sa_task1)

        self.standalone_labbook1 = self.rest_create_labbook(self.token1, None, "Standalone Test Labbok", False,
                                                            HTTP_USER_AGENT, REMOTE_ADDR)

        self.standalone_contact1 = self.rest_create_contact(self.token1, None, 'Dr.', 'John', 'Doe', 'email@email.com',
                                                            HTTP_USER_AGENT, REMOTE_ADDR)

        self.standalone_file1 = self.rest_create_file(self.token1, None, 'MyStandaloneFile',
                                                      'This is a standalone file!', 'MyStandaloneFileName', 1024,
                                                      HTTP_USER_AGENT, REMOTE_ADDR)

        self.standalone_note1 = self.rest_create_note(self.token1, None, 'This is a standalone note',
                                                      'Still a standalone note',
                                                      HTTP_USER_AGENT, REMOTE_ADDR)

        self.standalone_meeting1 = self.rest_create_meeting(self.token1, None, 'Standalone Meeting', 'Meet me alone!',
                                                            timezone.now(), timezone.now(),
                                                            HTTP_USER_AGENT, REMOTE_ADDR)

        self.standalone_kanban1 = self.rest_create_kanbanboard(self.token1, None, 'Standalone Kanban Board',
                                                               KanbanBoard.KANBAN_BOARD_TYPE_PERSONAL,
                                                               HTTP_USER_AGENT, REMOTE_ADDR)

        self.standalone_picture1 = self.rest_create_picture(self.token1, None, 'Standalone Picture',
                                                            'demo1.png', HTTP_USER_AGENT, REMOTE_ADDR)

        self.dmp_form = DmpForm.objects.create(title='test dmpform title', description='test dmpform desc')

        self.dmp_status = 'NEW'

        self.standalone_dmp1 = self.rest_create_dmp(self.token1, None, 'Test DMP Title', self.dmp_status,
                                                    self.dmp_form.pk,
                                                    HTTP_USER_AGENT, REMOTE_ADDR)

        self.standalone_drive1 = self.rest_create_drive(self.token1, None, "Standalone drive a - b", HTTP_USER_AGENT,
                                                        REMOTE_ADDR)

        # create a project with elements assigned to it
        self.project1 = self.create_project(
            self.token1, "My Own Project (testuser1)",
            "Only testuser1 has access to this project", "START",
            HTTP_USER_AGENT, REMOTE_ADDR
        )

        self.project1_task1 = self.rest_create_task(self.token1, self.project1.pk, 'Project Test Task',
                                                    'Test Description',
                                                    Task.TASK_STATE_NEW, Task.TASK_PRIORITY_HIGH, datetime.now(),
                                                    datetime.now() + timedelta(days=30),
                                                    self.testuser1.pk,
                                                    HTTP_USER_AGENT, REMOTE_ADDR)

        self.http_info_project1_task1 = HttpInfo(auth_token=self.token1,
                                                 user_agent=HTTP_USER_AGENT, remote_address=REMOTE_ADDR)
        self.project1_task1_pk = self.project1_task1.data['pk']
        self.project1_task1_versiondata = VersionData(object_id=self.project1_task1_pk,
                                                      summary="My project 1 task 1 version").as_dict()
        self.project1_task1_version = self.rest_post_version('tasks', self.project1_task1_pk,
                                                             self.project1_task1_versiondata,
                                                             self.http_info_project1_task1)

        self.project1_task2 = self.rest_create_task(self.token1, self.project1.pk, 'Project Test Task 2',
                                                    'Test Description 2',
                                                    Task.TASK_STATE_NEW, Task.TASK_PRIORITY_HIGH, datetime.now(),
                                                    datetime.now() + timedelta(days=30),
                                                    self.testuser1.pk,
                                                    HTTP_USER_AGENT, REMOTE_ADDR)

        self.project1_labbook1 = self.rest_create_labbook(self.token1, self.project1.pk, "Standalone Test Labbok",
                                                          False, HTTP_USER_AGENT, REMOTE_ADDR)

        self.project1_contact1 = self.rest_create_contact(self.token1, self.project1.pk, 'MSC', 'Jane', 'Mnuchin',
                                                          'jane@email.com',
                                                          HTTP_USER_AGENT, REMOTE_ADDR)

        self.project1_file1 = self.rest_create_file(self.token1, self.project1.pk, 'MyFile', 'This is a file!',
                                                    'MyFileName', 1024,
                                                    HTTP_USER_AGENT, REMOTE_ADDR)

        self.project1_note1 = self.rest_create_note(self.token1, self.project1.pk, 'This is a project note',
                                                    'Still a project note',
                                                    HTTP_USER_AGENT, REMOTE_ADDR)

        self.project1_meeting1 = self.rest_create_meeting(self.token1, self.project1.pk, 'Project Meeting',
                                                          'Meet all the project members!', timezone.now(),
                                                          timezone.now(),
                                                          HTTP_USER_AGENT, REMOTE_ADDR)

        self.project1_kanban1 = self.rest_create_kanbanboard(self.token1, self.project1.pk, 'Project Kanban Board',
                                                             KanbanBoard.KANBAN_BOARD_TYPE_PERSONAL,
                                                             HTTP_USER_AGENT, REMOTE_ADDR)

        self.project1_picture1 = self.rest_create_picture(self.token1, self.project1.pk, 'Project Picture', 'demo1.png',
                                                          HTTP_USER_AGENT, REMOTE_ADDR)

        self.project1_dmp1 = self.rest_create_dmp(self.token1, self.project1.pk, 'Test Project DMP Title',
                                                  self.dmp_status,
                                                  self.dmp_form.pk,
                                                  HTTP_USER_AGENT, REMOTE_ADDR)

        self.project1_drive1 = self.rest_create_drive(self.token1, None, "Project drive a - b", HTTP_USER_AGENT,
                                                      REMOTE_ADDR)

        # ## the same objects are created for testuser2 to see if the deletion is user-independent
        # ## (testuser1 is used in the deletion test for all objects)

        # create some elements outside of a project:
        self.standalone_task2 = self.rest_create_task(self.token2, None, "Standalone Test Task", "Test Description",
                                                      Task.TASK_STATE_NEW, Task.TASK_PRIORITY_HIGH, datetime.now(),
                                                      datetime.now() + timedelta(days=30),
                                                      self.testuser1.pk, HTTP_USER_AGENT, REMOTE_ADDR)

        self.http_info_sa_task2 = HttpInfo(auth_token=self.token2, user_agent=HTTP_USER_AGENT,
                                           remote_address=REMOTE_ADDR)
        self.sa_task2_pk = self.standalone_task2.data['pk']
        self.sa_task2_versiondata = VersionData(object_id=self.sa_task2_pk, summary="My standalone version 2").as_dict()
        self.standalone_task2_version = self.rest_post_version('tasks', self.sa_task2_pk, self.sa_task2_versiondata,
                                                               self.http_info_sa_task2)

        self.standalone_labbook2 = self.rest_create_labbook(self.token2, None, "Standalone Test Labbok", False,
                                                            HTTP_USER_AGENT, REMOTE_ADDR)

        self.standalone_contact2 = self.rest_create_contact(self.token2, None, 'Dr.', 'John', 'Doe', 'email@email.com',
                                                            HTTP_USER_AGENT, REMOTE_ADDR)

        self.standalone_file2 = self.rest_create_file(self.token2, None, 'MyStandaloneFile',
                                                      'This is a standalone file!', 'MyStandaloneFileName', 1024,
                                                      HTTP_USER_AGENT, REMOTE_ADDR)

        self.standalone_note2 = self.rest_create_note(self.token2, None, 'This is a standalone note',
                                                      'Still a standalone note',
                                                      HTTP_USER_AGENT, REMOTE_ADDR)

        self.standalone_meeting2 = self.rest_create_meeting(self.token2, None, 'Standalone Meeting', 'Meet me alone!',
                                                            timezone.now(), timezone.now(),
                                                            HTTP_USER_AGENT, REMOTE_ADDR)

        self.standalone_kanban2 = self.rest_create_kanbanboard(self.token2, None, 'Standalone Kanban Board',
                                                               KanbanBoard.KANBAN_BOARD_TYPE_PERSONAL,
                                                               HTTP_USER_AGENT, REMOTE_ADDR)

        self.standalone_picture2 = self.rest_create_picture(self.token2, None, 'Standalone Picture',
                                                            'demo1.png', HTTP_USER_AGENT, REMOTE_ADDR)

        self.standalone_dmp2 = self.rest_create_dmp(self.token2, None, 'Test DMP Title', self.dmp_status,
                                                    self.dmp_form.pk,
                                                    HTTP_USER_AGENT, REMOTE_ADDR)

        self.standalone_drive2 = self.rest_create_drive(self.token2, None, "Standalone drive a - b", HTTP_USER_AGENT,
                                                        REMOTE_ADDR)

        # create a project with elements assigned to it
        self.project2 = self.create_project(
            self.token2, "My Own Project (testuser2)",
            "Only testuser2 has access to this project", "START",
            HTTP_USER_AGENT, REMOTE_ADDR
        )

        self.project2_task1 = self.rest_create_task(self.token2, self.project2.pk, 'Project Test Task',
                                                    'Test Description',
                                                    Task.TASK_STATE_NEW, Task.TASK_PRIORITY_HIGH, datetime.now(),
                                                    datetime.now() + timedelta(days=30),
                                                    self.testuser1.pk,
                                                    HTTP_USER_AGENT, REMOTE_ADDR)

        self.http_info_project2_task1 = HttpInfo(auth_token=self.token2,
                                                 user_agent=HTTP_USER_AGENT, remote_address=REMOTE_ADDR)
        self.project2_task1_pk = self.project2_task1.data['pk']
        self.project2_task1_versiondata = VersionData(object_id=self.project2_task1_pk, summary="My version").as_dict()
        self.project2_task1_version = self.rest_post_version('tasks', self.project2_task1_pk,
                                                             self.project2_task1_versiondata,
                                                             self.http_info_project2_task1)

        self.project2_task2 = self.rest_create_task(self.token2, self.project2.pk, 'Project Test Task 2',
                                                    'Test Description 2',
                                                    Task.TASK_STATE_NEW, Task.TASK_PRIORITY_HIGH, datetime.now(),
                                                    datetime.now() + timedelta(days=30),
                                                    self.testuser1.pk,
                                                    HTTP_USER_AGENT, REMOTE_ADDR)

        self.project2_labbook1 = self.rest_create_labbook(self.token2, self.project2.pk, "Standalone Test Labbok",
                                                          False, HTTP_USER_AGENT, REMOTE_ADDR)

        self.project2_contact1 = self.rest_create_contact(self.token2, self.project2.pk, 'MSC', 'Jane', 'Mnuchin',
                                                          'jane@email.com',
                                                          HTTP_USER_AGENT, REMOTE_ADDR)

        self.project2_file1 = self.rest_create_file(self.token2, self.project2.pk, 'MyFile', 'This is a file!',
                                                    'MyFileName', 1024,
                                                    HTTP_USER_AGENT, REMOTE_ADDR)

        self.project2_note1 = self.rest_create_note(self.token2, self.project2.pk, 'This is a project note',
                                                    'Still a project note',
                                                    HTTP_USER_AGENT, REMOTE_ADDR)

        self.project2_meeting1 = self.rest_create_meeting(self.token2, self.project2.pk, 'Project Meeting',
                                                          'Meet all the project members!', timezone.now(),
                                                          timezone.now(),
                                                          HTTP_USER_AGENT, REMOTE_ADDR)

        self.project2_kanban1 = self.rest_create_kanbanboard(self.token2, self.project2.pk, 'Project Kanban Board',
                                                             KanbanBoard.KANBAN_BOARD_TYPE_PERSONAL,
                                                             HTTP_USER_AGENT, REMOTE_ADDR)

        self.project2_picture1 = self.rest_create_picture(self.token2, self.project2.pk, 'Project Picture', 'demo1.png',
                                                          HTTP_USER_AGENT, REMOTE_ADDR)

        self.project2_dmp1 = self.rest_create_dmp(self.token2, self.project2.pk, 'Test Project DMP Title',
                                                  self.dmp_status,
                                                  self.dmp_form.pk,
                                                  HTTP_USER_AGENT, REMOTE_ADDR)

        self.project2_drive1 = self.rest_create_drive(self.token2, self.project2.pk, "Project drive a - b",
                                                      HTTP_USER_AGENT,
                                                      REMOTE_ADDR)

        self.fraction_field = MetadataField.objects.create(
            name='MyFraction', description="...",
            base_type=MetadataField.BASE_TYPE_FRACTION, type_settings={},
        )

        self.decimal_field = MetadataField.objects.create(
            name='MyDecimal', description="...",
            base_type=MetadataField.BASE_TYPE_DECIMAL_NUMBER, type_settings={},
        )

    @override_settings()
    def test_verify_database_not_cleaned_without_setting(self):
        """
        Tests verifying that the database clean-function is NOT applied when
        settings.CLEAN_ALL_WORKBENCH_MODELS does not exist/is false
        :return:
        """
        if hasattr(settings, 'CLEAN_ALL_WORKBENCH_MODELS'):
            del settings.CLEAN_ALL_WORKBENCH_MODELS

        self.client.credentials(HTTP_AUTHORIZATION='Token ' + self.token1)

        self.assertEqual(self.count_workbench_records(), EXPECTED_NUMBER_OF_WORKBENCH_RECORDS)

        response = self.client.post(
            '/api/clean_workbench_models/'.format(),
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(self.count_workbench_records(), EXPECTED_NUMBER_OF_WORKBENCH_RECORDS)

    @override_settings(CLEAN_ALL_WORKBENCH_MODELS=True)
    def test_verify_database_cleaned_with_setting(self):
        """
        Tests verifying that the database clean-function is applied when
        settings.CLEAN_ALL_WORKBENCH_MODELS is set to True
        :return:
        """

        self.client.credentials(HTTP_AUTHORIZATION='Token ' + self.token1)

        self.assertEqual(self.count_workbench_records(), EXPECTED_NUMBER_OF_WORKBENCH_RECORDS)

        response = self.client.post(
            '/api/clean_workbench_models'.format(),
            HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # no workbench model records should be left by now
        self.assertEqual(self.count_workbench_records(), 0)

    def count_workbench_records(self):
        """
        Fetch all workbench models and return the sum of the count of all records
        :return:
        """
        all_workbench_models = get_all_workbench_models(WorkbenchEntityMixin)

        records = 0
        for model in all_workbench_models:
            records = records + model.objects.count()
        records = records + Version.objects.count()
        records = records + Metadata.objects.count()
        return records
