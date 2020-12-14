#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import json

from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from eric.drives.models import Directory
from eric.drives.tests.core import DriveMixin
from eric.dss.models import DSSContainer
from eric.dss.tests.core import DSSContainerMixin, DSSEnvelopeMixin
from eric.projects.models import Group
from eric.projects.tests.core import AuthenticationMixin
from eric.shared_elements.models import File
from eric.shared_elements.tests.core import FileMixin

User = get_user_model()

HTTP_USER_AGENT = "APITestClient"
REMOTE_ADDR = "127.0.0.1"
METADATA_JSON = '{"tum_id": "student_2", "metadata_fields": []}'


class ApiContainerPermissionTest(APITestCase, AuthenticationMixin, DSSContainerMixin, DSSEnvelopeMixin, DriveMixin,
                                 FileMixin):
    """
    Tests DSS File and DSS Storage Permissions Using the REST API
    """

    def setUp(self):
        self.curator_group = Group.objects.get(name='DSS Curator')
        self.user_group = Group.objects.get(name='User')

        self.user1 = User.objects.create_user(
            username='student_1', email='student_1@email.com', password='top_secret')
        self.user1.groups.add(self.user_group)
        self.user1.groups.add(self.curator_group)

        self.user2 = User.objects.create_user(
            username='student_2', email='student_2@email.com', password='foobar')
        self.user2.groups.add(self.user_group)

        self.superuser = User.objects.create_user(
            username='superuser', email='super@user.com', password='sudo', is_superuser=True,
        )

        self.token1 = self.login_and_return_token('student_1', 'top_secret')
        self.token2 = self.login_and_return_token('student_2', 'foobar')
        self.superuser_token = self.login_and_return_token('superuser', 'sudo')

        # create container
        self.container, response = self.create_dsscontainer_orm(self.token1, None,
                                                                "mf29er-dss-0000",
                                                                "dssfs01/mf29er/mf29er-dss-0000",
                                                                DSSContainer.READ_WRITE_ALL,
                                                                DSSContainer.IMPORT_ALL,
                                                                HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_201_CREATED)

        # update container to make it read-write-only-new
        response = self.rest_update_dsscontainer(self.token1,
                                                 self.container.pk,
                                                 None,
                                                 "mf29er-dss-0000",
                                                 "dssfs01/mf29er/mf29er-dss-0000",
                                                 DSSContainer.READ_WRITE_ONLY_NEW,
                                                 DSSContainer.IMPORT_ALL,
                                                 HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_200_OK)
        # get the updated container
        response = self.rest_get_dsscontainer(
            self.token1,
            self.container.pk,
            HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEquals(response.status_code, status.HTTP_200_OK)
        self.read_write_only_new_container = json.loads(response.content.decode())
        self.assertEquals(self.read_write_only_new_container["read_write_setting"], DSSContainer.READ_WRITE_ONLY_NEW)

    def test_moving_drive_in_read_only_container_is_forbidden(self):
        """
        Tests moving drive in read-only container is forbidden
        """
        # create envelope-1
        envelope_1, response = self.create_dssenvelope_orm(self.token1,
                                                           "envelope-1",
                                                           METADATA_JSON,
                                                           self.container.pk,
                                                           False,
                                                           HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_201_CREATED)

        # create envelope-2
        envelope_2, response = self.create_dssenvelope_orm(self.token1,
                                                           "envelope-2",
                                                           METADATA_JSON,
                                                           self.container.pk,
                                                           False,
                                                           HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_201_CREATED)

        # create drive and assign to envelope-1
        drive, response = self.create_dss_drive_orm(self.token1, None, "Some title", envelope_1.pk, False,
                                                    HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_201_CREATED)

        # update container to make it read-only
        response = self.rest_update_dsscontainer(self.token1,
                                                 self.container.pk,
                                                 None,
                                                 "mf29er-dss-0000",
                                                 "dssfs01/mf29er/mf29er-dss-0000",
                                                 DSSContainer.READ_ONLY,
                                                 DSSContainer.IMPORT_ALL,
                                                 HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # get the updated container
        response = self.rest_get_dsscontainer(
            self.token1,
            self.container.pk,
            HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEquals(response.status_code, status.HTTP_200_OK)
        container = json.loads(response.content.decode())
        self.assertEquals(container["read_write_setting"], DSSContainer.READ_ONLY)

        # try to move the drive to another envelope
        response = self.rest_update_dss_drive(
            self.token1,
            drive.pk,
            None,
            "Some title",
            envelope_2.pk,
            False,
            HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEquals(response.status_code, status.HTTP_400_BAD_REQUEST)
        response = json.loads(response.content.decode())
        self.assertEquals(response["envelope"][0], "It is not allowed to move storages within read-only DSS "
                                                   "containers")

    def test_create_new_structure_in_read_write_only_new_container_is_ok(self):
        # create envelope
        envelope, response = self.create_dssenvelope_orm(self.token1,
                                                         "envelope",
                                                         METADATA_JSON,
                                                         self.read_write_only_new_container["pk"],
                                                         False,
                                                         HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_201_CREATED)

        # create drive and assign to envelope
        drive, response = self.create_dss_drive_orm(self.token1, None, "Some title", envelope.pk, False,
                                                    HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_201_CREATED)
        # get root directory of the drive
        root_dir = drive.sub_directories.all()[0].pk

        # create a directory within the drive
        response = self.rest_drive_create_directory(self.token1, str(drive.pk), "My Subdir",
                                                    root_dir, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_201_CREATED)
        decoded_response = json.loads(response.content.decode())
        directory = Directory.objects.get(pk=decoded_response['pk'])
        self.assertEquals(directory.name, "My Subdir", msg="Verify that directory title was properly saved in database")

        # create a dss file with 1024 bytes
        response = self.rest_create_dss_file(self.token1, None, 'Test Title', 'Test Description',
                                             'somefile.txt', 1024, directory.pk, False,
                                             HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        # decode response
        decoded = json.loads(response.content.decode())
        # get file object from db
        file = File.objects.get(pk=decoded['pk'])
        self.assertTrue(file.is_dss_file, "The File should be a DSS File")

    def test_update_new_envelope_in_read_write_only_new_container_is_ok(self):
        # create envelope
        envelope, response = self.create_dssenvelope_orm(self.token1,
                                                         "envelope",
                                                         METADATA_JSON,
                                                         self.read_write_only_new_container["pk"],
                                                         False,
                                                         HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_201_CREATED)

        # update envelope
        response = self.rest_update_dssenvelope(self.token1,
                                                envelope.pk,
                                                "envelope",
                                                METADATA_JSON,
                                                self.read_write_only_new_container["pk"],
                                                False,
                                                HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_200_OK)

    def test_update_new_drive_in_read_write_only_new_container_is_ok(self):
        # create envelope
        envelope, response = self.create_dssenvelope_orm(self.token1,
                                                         "envelope",
                                                         METADATA_JSON,
                                                         self.read_write_only_new_container["pk"],
                                                         False,
                                                         HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_201_CREATED)

        # create drive and assign to envelope
        drive, response = self.create_dss_drive_orm(self.token1, None, "Some title", envelope.pk, False,
                                                    HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_201_CREATED)

        response = self.rest_update_dss_drive(self.token1, drive.pk, None, "Some edited title",
                                              envelope.pk, False, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_200_OK)

    def test_update_new_directory_in_read_write_only_new_container_is_ok(self):
        # create envelope
        envelope, response = self.create_dssenvelope_orm(self.token1,
                                                         "envelope",
                                                         METADATA_JSON,
                                                         self.read_write_only_new_container["pk"],
                                                         False,
                                                         HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_201_CREATED)

        # create drive and assign to envelope
        drive, response = self.create_dss_drive_orm(self.token1, None, "Some title", envelope.pk, False,
                                                    HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_201_CREATED)
        # get root directory of the drive
        root_dir = drive.sub_directories.all()[0].pk

        # create a directory within the drive
        response = self.rest_drive_create_dss_directory(self.token1, str(drive.pk), "My Subdir",
                                                        root_dir, False, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_201_CREATED)
        decoded_response = json.loads(response.content.decode())
        directory = Directory.objects.get(pk=decoded_response['pk'])
        self.assertEquals(directory.name, "My Subdir", msg="Verify that directory title was properly saved in database")

        # edit a directory within the drive
        response = self.rest_drive_update_directory(self.token1, str(drive.pk), directory.pk, "My edited Subdir",
                                                    root_dir, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_200_OK)
        decoded_response = json.loads(response.content.decode())
        directory = Directory.objects.get(pk=decoded_response['pk'])
        self.assertEquals(directory.name, "My edited Subdir",
                          msg="Verify that directory title was properly saved in database")

    def test_update_new_file_in_read_write_only_new_container_is_ok(self):
        # create envelope
        envelope, response = self.create_dssenvelope_orm(self.token1,
                                                         "envelope",
                                                         METADATA_JSON,
                                                         self.read_write_only_new_container["pk"],
                                                         False,
                                                         HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_201_CREATED)

        # create drive and assign to envelope
        drive, response = self.create_dss_drive_orm(self.token1, None, "Some title", envelope.pk, False,
                                                    HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_201_CREATED)
        # get root directory of the drive
        root_dir = drive.sub_directories.all()[0].pk

        # create a directory within the drive
        response = self.rest_drive_create_directory(self.token1, str(drive.pk), "My Subdir",
                                                    root_dir, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_201_CREATED)
        decoded_response = json.loads(response.content.decode())
        directory = Directory.objects.get(pk=decoded_response['pk'])
        self.assertEquals(directory.name, "My Subdir", msg="Verify that directory title was properly saved in database")

        # create a dss file with 1024 bytes
        response = self.rest_create_dss_file(self.token1, None, 'Test Title', 'Test Description',
                                             'somefile.txt', 1024, directory.pk, False,
                                             HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        # decode response
        decoded = json.loads(response.content.decode())
        # get file object from db
        file = File.objects.get(pk=decoded['pk'])
        self.assertTrue(file.is_dss_file, "The File should be a DSS File")

        # update file
        response = self.rest_update_file(self.token1, file.pk, None, 'Test Title', 'Test Description',
                                         'somefile_edited.txt', 1024,
                                         HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_200_OK)

    def test_update_imported_envelope_in_read_write_only_new_container_is_forbidden(self):
        # create envelope
        envelope, response = self.create_dssenvelope_orm(self.token1,
                                                         "envelope",
                                                         METADATA_JSON,
                                                         self.read_write_only_new_container["pk"],
                                                         True,
                                                         HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_201_CREATED)

        # update envelope
        response = self.rest_update_dssenvelope(self.token1,
                                                envelope.pk,
                                                "envelope edited",
                                                METADATA_JSON,
                                                self.read_write_only_new_container["pk"],
                                                True,
                                                HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_418_IM_A_TEAPOT)

    def test_update_imported_drive_in_read_write_only_new_container_is_forbidden(self):
        # create envelope
        envelope, response = self.create_dssenvelope_orm(self.token1,
                                                         "envelope",
                                                         METADATA_JSON,
                                                         self.read_write_only_new_container["pk"],
                                                         True,
                                                         HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_201_CREATED)

        # create drive and assign to envelope
        drive, response = self.create_dss_drive_orm(self.token1, None, "Some title", envelope.pk, True,
                                                    HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_201_CREATED)

        response = self.rest_update_dss_drive(self.token1, drive.pk, None, "Some edited title",
                                              envelope.pk, True, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_418_IM_A_TEAPOT)

    def test_update_imported_directory_in_read_write_only_new_container_is_forbidden(self):
        # create envelope
        envelope, response = self.create_dssenvelope_orm(self.token1,
                                                         "envelope",
                                                         METADATA_JSON,
                                                         self.read_write_only_new_container["pk"],
                                                         True,
                                                         HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_201_CREATED)

        # create drive and assign to envelope
        drive, response = self.create_dss_drive_orm(self.token1, None, "Some title", envelope.pk, True,
                                                    HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_201_CREATED)
        # get root directory of the drive
        root_dir = drive.sub_directories.all()[0].pk

        # create a directory within the drive
        response = self.rest_drive_create_dss_directory(self.token1, str(drive.pk), "My Subdir",
                                                        root_dir, True, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_201_CREATED)
        decoded_response = json.loads(response.content.decode())
        directory = Directory.objects.get(pk=decoded_response['pk'])
        self.assertEquals(directory.name, "My Subdir", msg="Verify that directory title was properly saved in database")

        # edit a directory within the drive
        response = self.rest_drive_update_directory(self.token1, str(drive.pk), directory.pk, "My edited Subdir",
                                                    root_dir, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_418_IM_A_TEAPOT)
        directory = Directory.objects.get(pk=decoded_response['pk'])
        self.assertEquals(directory.name, "My Subdir",
                          msg="Verify that directory title was properly saved in database")

    def test_update_imported_file_in_read_write_only_new_container_is_forbidden(self):
        # create envelope
        envelope, response = self.create_dssenvelope_orm(self.token1,
                                                         "envelope",
                                                         METADATA_JSON,
                                                         self.read_write_only_new_container["pk"],
                                                         True,
                                                         HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_201_CREATED)

        # create drive and assign to envelope
        drive, response = self.create_dss_drive_orm(self.token1, None, "Some title", envelope.pk, True,
                                                    HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_201_CREATED)
        # get root directory of the drive
        root_dir = drive.sub_directories.all()[0].pk

        # create a directory within the drive
        response = self.rest_drive_create_directory(self.token1, str(drive.pk), "My Subdir",
                                                    root_dir, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_201_CREATED)
        decoded_response = json.loads(response.content.decode())
        directory = Directory.objects.get(pk=decoded_response['pk'])
        self.assertEquals(directory.name, "My Subdir", msg="Verify that directory title was properly saved in database")

        # create a dss file with 1024 bytes
        response = self.rest_create_dss_file(self.token1, None, 'Test Title', 'Test Description',
                                             'somefile.txt', 1024, directory.pk, True,
                                             HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        # decode response
        decoded = json.loads(response.content.decode())
        # get file object from db
        file = File.objects.get(pk=decoded['pk'])
        self.assertTrue(file.is_dss_file, "The File should be a DSS File")

        # update file
        response = self.rest_update_file(self.token1, file.pk, None, 'Test Title', 'Test Description',
                                         'somefile_edited.txt', 1024,
                                         HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_418_IM_A_TEAPOT)
