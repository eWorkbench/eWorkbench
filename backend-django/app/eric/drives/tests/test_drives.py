#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import json

from rest_framework import status
from rest_framework.test import APITestCase

from eric.core.tests import test_utils
from eric.drives.models import Directory, Drive
from eric.drives.tests.core import DriveMixin
from eric.model_privileges.models import ModelPrivilege
from eric.projects.tests.mixin_entity_generic_tests import EntityChangeRelatedProjectTestMixin
from eric.shared_elements.models import File
from eric.shared_elements.tests.core import FileMixin, NoteMixin

HTTP_USER_AGENT = "APITestClient"
REMOTE_ADDR = "127.0.0.1"


class TestGenericsDrives(APITestCase, EntityChangeRelatedProjectTestMixin, DriveMixin, NoteMixin, FileMixin):
    entity = Drive

    def setUp(self):
        self.superSetUp()

        self.data = [
            {
                "title": "Public",
                "project_pks": None,
            },
            {
                "title": "Private",
                "project_pks": None,
            },
        ]

    def test_create_directory(self):
        """
        Tests creating directories within multiple drives
        """
        # create drive
        drive, response = self.create_drive_orm(self.token1, None, "Some title", HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # get root directory of the drive
        root_dir = drive.sub_directories.all()[0].pk

        # create a directory within the drive
        response = self.rest_drive_create_directory(
            self.token1, str(drive.pk), "My Subdir", root_dir, HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        decoded_response = json.loads(response.content.decode())
        directory = Directory.objects.get(pk=decoded_response["pk"])

        self.assertEqual(
            decoded_response["name"],
            "My Subdir",
            msg="Verify that directory title was properly transmitted via REST API",
        )
        self.assertEqual(directory.name, "My Subdir", msg="Verify that directory title was properly saved in database")

        # get all directories of the drive
        response = self.rest_drive_get_directories(self.token1, str(drive.pk), HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        directories = json.loads(response.content.decode())
        print(directories)
        self.assertEqual(len(directories), 2, msg="There should be two directories for this drive")
        self.assertEqual(
            directories[0]["drive_id"], str(drive.id), msg="Directories should be associated to this drive"
        )
        self.assertEqual(
            directories[1]["drive_id"], str(drive.id), msg="Directories should be associated to this drive"
        )

        # create another drive
        second_drive, response = self.create_drive_orm(self.token1, None, "another drive", HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # get root directory of the second_drive
        second_root_dir = second_drive.sub_directories.all()[0].pk

        # create a directory within the second drive
        response = self.rest_drive_create_directory(
            self.token1, str(second_drive.pk), "My Subdir", second_root_dir, HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # get all directories of the new drive
        response = self.rest_drive_get_directories(self.token1, str(second_drive.pk), HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        directories = json.loads(response.content.decode())
        self.assertEqual(len(directories), 2, msg="There should be two directories for the second drive")
        self.assertEqual(
            directories[0]["drive_id"], str(second_drive.id), msg="Directories should be associated to the second drive"
        )
        self.assertEqual(
            directories[1]["drive_id"], str(second_drive.id), msg="Directories should be associated to the second drive"
        )

    def test_create_sub_directories(self):
        """
        Tests creating several sub directories within a drive
        """
        # create drive
        drive, response = self.create_drive_orm(self.token1, None, "Some title", HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # get root directory of the drive
        root_dir = drive.sub_directories.all()[0].pk

        # create a directory within the drive
        response = self.rest_drive_create_directory(
            self.token1, str(drive.pk), "My dir", root_dir, HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        decoded_directory = json.loads(response.content.decode())

        # create a sub directory (below the above directory)
        response = self.rest_drive_create_directory(
            self.token1, str(drive.pk), "subdir", decoded_directory["pk"], HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        decoded_sub_directory = json.loads(response.content.decode())

        # check that the sub directory has the above directory as parent directory
        self.assertEqual(decoded_sub_directory["directory"], decoded_directory["pk"])

        # Create another sub directory (below the first directory)
        response = self.rest_drive_create_directory(
            self.token1, str(drive.pk), "second subdir", decoded_directory["pk"], HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        decoded_sub_directory2 = json.loads(response.content.decode())

        # check that the sub directory has the above directory as parent directory
        self.assertEqual(decoded_sub_directory2["directory"], decoded_directory["pk"])

    def test_update_sub_directory(self):
        """
        Tests updating a subdirectory
        """
        # create drive
        drive, response = self.create_drive_orm(self.token1, None, "Some title", HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # get root directory of the drive
        root_dir = drive.sub_directories.all()[0].pk

        # create a directory within the drive
        response = self.rest_drive_create_directory(
            self.token1, str(drive.pk), "My dir", root_dir, HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        decoded_directory = json.loads(response.content.decode())

        # update the directory title
        response = self.rest_drive_update_directory(
            self.token1, str(drive.pk), decoded_directory["pk"], "My Directory", None, HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # verify that the title has changed in database
        directory = Directory.objects.get(pk=decoded_directory["pk"])
        self.assertEqual(directory.name, "My Directory")

    def test_create_sub_directory_in_wrong_drive(self):
        """
        Tests that creating a sub directory with a parent directory of another drive does not work
        (Means: The parent directory needs to be in the same drive as the directory that is being created/modified)
        """
        # create two drives
        first_drive, response = self.create_drive_orm(self.token1, None, "First drive", HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # get root directory of the first drive
        first_root_dir = first_drive.sub_directories.all()[0].pk

        second_drive, response = self.create_drive_orm(self.token1, None, "Second drive", HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # get root directory of the second drive
        second_root_dir = second_drive.sub_directories.all()[0].pk

        # create a directory within the first drive
        response = self.rest_drive_create_directory(
            self.token1, str(first_drive.pk), "My dir", first_root_dir, HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        first_drive_first_directory = json.loads(response.content.decode())

        # create a directory within the second drive
        response = self.rest_drive_create_directory(
            self.token1, str(second_drive.pk), "My dir", second_root_dir, HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        second_drive_first_directory = json.loads(response.content.decode())

        # create a sub directory in the first_drive, below the directory of the second drive (should not work)
        response = self.rest_drive_create_directory(
            self.token1,
            str(first_drive.pk),
            "My subdir",
            second_drive_first_directory["pk"],
            HTTP_USER_AGENT,
            REMOTE_ADDR,
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        # now try to update the parent directory of the existing second_drive_first_directory to first_drive_first_directory
        response = self.rest_drive_update_directory(
            self.token1,
            str(second_drive.pk),
            second_drive_first_directory["pk"],
            "My dir",
            first_drive_first_directory["pk"],
            HTTP_USER_AGENT,
            REMOTE_ADDR,
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_can_not_set_parent_directory_to_own_directory(self):
        """
        Tests that it is impossible to udpate a directories parent_directory as itself
        """
        # create drive
        drive, response = self.create_drive_orm(self.token1, None, "Some title", HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # get root directory of the drive
        root_dir = drive.sub_directories.all()[0].pk

        # create a directory within the drive
        response = self.rest_drive_create_directory(
            self.token1, str(drive.pk), "My dir", root_dir, HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        decoded_directory = json.loads(response.content.decode())

        # update the directories parent_directory
        response = self.rest_drive_update_directory(
            self.token1,
            str(drive.pk),
            decoded_directory["pk"],
            "My dir",
            decoded_directory["pk"],
            HTTP_USER_AGENT,
            REMOTE_ADDR,
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_can_not_update_directory_recursive_relation_between_subdirectories(self):
        """
        Tests creating sub directories and creating a recursive relationship between those (which is not allowed)
        """
        # create drive
        drive, response = self.create_drive_orm(self.token1, None, "Some title", HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # get root directory of the drive
        root_dir = drive.sub_directories.all()[0].pk

        # create a directory within the drive
        response = self.rest_drive_create_directory(
            self.token1, str(drive.pk), "My dir", root_dir, HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        decoded_directory = json.loads(response.content.decode())

        # create another directory within the drive, with decoded_directory as the parent
        response = self.rest_drive_create_directory(
            self.token1, str(drive.pk), "My subdir", decoded_directory["pk"], HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        decoded_sub_directory = json.loads(response.content.decode())

        # now update the first directory, and set its parent to decoded_sub_directory
        response = self.rest_drive_update_directory(
            self.token1,
            str(drive.pk),
            decoded_directory["pk"],
            "My dir",
            decoded_sub_directory["pk"],
            HTTP_USER_AGENT,
            REMOTE_ADDR,
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_can_not_create_directory_without_permission(self):
        """
        Tests that creating a directory fails when the user does not have the proper privilege/permission
        """
        # create drive
        drive, response = self.create_drive_orm(self.token1, None, "Some title", HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # get root directory of the drive
        root_dir = drive.sub_directories.all()[0].pk

        # create a directory within the drive
        response = self.rest_drive_create_directory(
            self.token1, str(drive.pk), "My dir", root_dir, HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # get all files within this drive (should be none)
        response = self.rest_drive_get_files(self.token1, str(drive.pk), HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        decoded_files = json.loads(response.content.decode())
        decoded_files = test_utils.get_paginated_results(decoded_files)
        self.assertEqual(len(decoded_files), 0)

        # give user2 view privileges for the drive
        response = self.rest_create_privilege(
            self.token1, "drives", str(drive.pk), self.user2.pk, HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        decoded_privilege = json.loads(response.content.decode())
        decoded_privilege["view_privilege"] = ModelPrivilege.ALLOW

        response = self.rest_update_privilege(
            self.token1, "drives", str(drive.pk), self.user2.pk, decoded_privilege, HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        decoded_privilege = json.loads(response.content.decode())

        # now user2 tries to create a directory within this drive (should not work)
        response = self.rest_drive_create_directory(
            self.token2, str(drive.pk), "My Subdir", root_dir, HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # give user2 the edit privilege for the drive
        decoded_privilege["edit_privilege"] = ModelPrivilege.ALLOW

        response = self.rest_update_privilege(
            self.token1, "drives", str(drive.pk), self.user2.pk, decoded_privilege, HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        decoded_privilege = json.loads(response.content.decode())

        # now user2 should be able to create a directory within this drive
        response = self.rest_drive_create_directory(
            self.token2, str(drive.pk), "My Subdir", root_dir, HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_auto_create_directory_when_creating_drive(self):
        """
        Tests that a directory is automatically created when creating a new drive
        """
        # no directories should exist
        self.assertEqual(Drive.objects.all().count(), 0)
        self.assertEqual(Directory.objects.all().count(), 0)

        # create drive
        drive, response = self.create_drive_orm(self.token1, None, "Some title", HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # check that directories exists
        self.assertEqual(Drive.objects.all().count(), 1)
        self.assertEqual(Directory.objects.filter(drive=drive).count(), 1)
        self.assertEqual(Directory.objects.filter(drive=drive, is_virtual_root=True).count(), 1)

    def test_can_not_create_directories_with_same_name_on_same_level(self):
        """
        Tests that it is not possible to create a directory with the same name on the same level
        Same level can be achieved by:
        A directory is linked to the same drive and has the same parent directory
        :return:
        """
        # create drive
        drive, response = self.create_drive_orm(self.token1, None, "Some title", HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # get root directory of the drive
        root_dir = drive.sub_directories.all()[0].pk

        # create a directory within the drive
        response = self.rest_drive_create_directory(
            self.token1, str(drive.pk), "My dir", root_dir, HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        decoded_directory = json.loads(response.content.decode())

        # create another directory with the same name at the root level (parent = None) - should not work
        response = self.rest_drive_create_directory(
            self.token1, str(drive.pk), "My dir", root_dir, HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        # create another directory with the same name below the decoded_directory (should work)
        response = self.rest_drive_create_directory(
            self.token1, str(drive.pk), "My dir", decoded_directory["pk"], HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # now try the same again (should not work, as it is a duplicate of the just created directory)
        response = self.rest_drive_create_directory(
            self.token1, str(drive.pk), "My dir", decoded_directory["pk"], HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_remove_directory(self):
        """
        Tests removing a directory
        :return:
        """
        # create drive
        drive, response = self.create_drive_orm(self.token1, None, "Some title", HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # get root directory of the drive
        root_dir = drive.sub_directories.all()[0].pk

        # create a directory within the drive
        response = self.rest_drive_create_directory(
            self.token1, str(drive.pk), "My dir", root_dir, HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        decoded_directory = json.loads(response.content.decode())

        # now delete the directory
        response = self.rest_drive_delete_directory(
            self.token1, str(drive.pk), decoded_directory["pk"], HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

        # the directory should no longer exist
        self.assertFalse(
            Directory.objects.filter(pk=decoded_directory["pk"]).exists(), msg="Directory should no longer exist"
        )

    def test_remove_directory_also_trashes_files(self):
        """
        Tests that removing a directory also trashes all files within this directory
        :return:
        """
        # create drive
        drive, response = self.create_drive_orm(self.token1, None, "Some title", HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # get root directory of the drive
        root_dir = drive.sub_directories.all()[0].pk

        # create a directory within the drive
        response = self.rest_drive_create_directory(
            self.token1, str(drive.pk), "My dir", root_dir, HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        decoded_directory = json.loads(response.content.decode())

        # create a file
        response = self.rest_create_file(
            self.token1, None, "My file", "M description", "my_file.txt", 1024, HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        decoded_file = json.loads(response.content.decode())

        # assign file to directory
        response = self.rest_update_file_set_directory(
            self.token1, decoded_file["pk"], decoded_directory["pk"], HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # now delete the directory
        response = self.rest_drive_delete_directory(
            self.token1, str(drive.pk), decoded_directory["pk"], HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

        # get the decoded_file from dB
        file = File.objects.get(pk=decoded_file["pk"])
        # check that this file has been trashed
        self.assertEqual(file.deleted, True)

    def test_remove_directory_recursively(self):
        """
        Tests that removing a directory with sub directories also removes those sub directories
        :return:
        """
        # create drive
        drive, response = self.create_drive_orm(self.token1, None, "Some title", HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # get root directory of the drive
        root_dir = drive.sub_directories.all()[0].pk

        # create a directory within the drive
        response = self.rest_drive_create_directory(
            self.token1, str(drive.pk), "My dir", root_dir, HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        decoded_directory = json.loads(response.content.decode())

        # create a sub directory
        response = self.rest_drive_create_directory(
            self.token1, str(drive.pk), "My subdir", decoded_directory["pk"], HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        decoded_sub_directory = json.loads(response.content.decode())

        # now delete the first directory
        response = self.rest_drive_delete_directory(
            self.token1, str(drive.pk), decoded_directory["pk"], HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

        # now both, the decoded_directory and the decoded_sub_directory should no longer exist
        self.assertFalse(Directory.objects.filter(pk=decoded_directory["pk"]).exists())
        self.assertFalse(Directory.objects.filter(pk=decoded_sub_directory["pk"]).exists())

    def test_assign_file_to_directory(self):
        """
        Tests that files can be assigned to directories
        """
        # create drive
        drive, response = self.create_drive_orm(self.token1, None, "Some title", HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # get root directory of the drive
        root_dir = drive.sub_directories.all()[0].pk

        # create a directory within the drive
        response = self.rest_drive_create_directory(
            self.token1, str(drive.pk), "My dir", root_dir, HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        decoded_directory = json.loads(response.content.decode())

        # create a file
        response = self.rest_create_file(
            self.token1, None, "My file", "M description", "my_file.txt", 1024, HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        decoded_file = json.loads(response.content.decode())

        # assign file to directory
        response = self.rest_update_file_set_directory(
            self.token1, decoded_file["pk"], decoded_directory["pk"], HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # get all files within this drive (should be one)
        response = self.rest_drive_get_files(self.token1, str(drive.pk), HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        decoded_files = json.loads(response.content.decode())
        decoded_files = test_utils.get_paginated_results(decoded_files)
        self.assertEqual(len(decoded_files), 1)
        self.assertEqual(decoded_files[0]["pk"], decoded_file["pk"])

    def test_assign_file_to_directory_inherited_permission(self):
        """
        Tests the inherited permissions/privileges of a file, if a file is added to a directory
        """
        # create drive
        drive, response = self.create_drive_orm(self.token1, None, "Some title", HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # get root directory of the drive
        root_dir = drive.sub_directories.all()[0].pk

        # create a directory within the drive
        response = self.rest_drive_create_directory(
            self.token1, str(drive.pk), "My dir", root_dir, HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        decoded_directory = json.loads(response.content.decode())

        # create a file
        response = self.rest_create_file(
            self.token1, None, "My file", "M description", "my_file.txt", 1024, HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        decoded_file = json.loads(response.content.decode())

        # assign file to directory
        response = self.rest_update_file_set_directory(
            self.token1, decoded_file["pk"], decoded_directory["pk"], HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # try to access the file with user2 (should not be possible)
        response = self.rest_get_file(self.token2, decoded_file["pk"], HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

        # give user2 view privilege for the drive
        response = self.rest_create_privilege(
            self.token1, "drives", str(drive.pk), self.user2.pk, HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        decoded_privilege = json.loads(response.content.decode())
        decoded_privilege["view_privilege"] = ModelPrivilege.ALLOW

        response = self.rest_update_privilege(
            self.token1, "drives", str(drive.pk), self.user2.pk, decoded_privilege, HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # now user2 should be able to access the file
        response = self.rest_get_file(self.token2, decoded_file["pk"], HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # verify privileges of user2 for the file
        response = self.rest_get_privileges_for_user(
            self.token2, "files", decoded_file["pk"], self.user2.pk, HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        decoded_privilege_for_file = json.loads(response.content.decode())
        self.assertEqual(decoded_privilege_for_file["view_privilege"], ModelPrivilege.ALLOW)
        self.assertEqual(decoded_privilege_for_file["edit_privilege"], ModelPrivilege.NEUTRAL)

    def test_can_not_remove_file_from_directory_if_directory_is_not_editable(self):
        """
        Tests that the current user can not remove a file from a directory that is not editable
        :return:
        """
        # create drive
        drive, response = self.create_drive_orm(self.token1, None, "Some title", HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # get root directory of the drive
        root_dir = drive.sub_directories.all()[0].pk

        # create a directory within the drive
        response = self.rest_drive_create_directory(
            self.token1, str(drive.pk), "My dir", root_dir, HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        decoded_directory = json.loads(response.content.decode())

        # get all files within this drive (should be none)
        response = self.rest_drive_get_files(self.token1, str(drive.pk), HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        decoded_files = json.loads(response.content.decode())
        decoded_files = test_utils.get_paginated_results(decoded_files)
        self.assertEqual(len(decoded_files), 0)

        # give user2 view privileges for the drive
        response = self.rest_create_privilege(
            self.token1, "drives", str(drive.pk), self.user2.pk, HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        decoded_privilege = json.loads(response.content.decode())

        # update privilege
        decoded_privilege["view_privilege"] = ModelPrivilege.ALLOW
        response = self.rest_update_privilege(
            self.token1, "drives", str(drive.pk), self.user2.pk, decoded_privilege, HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # create a file with user2
        response = self.rest_create_file(
            self.token2, None, "User2 file", "description", "my_file.txt", 1024, HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        decoded_file = json.loads(response.content.decode())

        # give user1 all privileges for this file
        response = self.rest_create_privilege(
            self.token2, "files", decoded_file["pk"], self.user1.pk, HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        decoded_privilege = json.loads(response.content.decode())
        decoded_privilege["view_privilege"] = ModelPrivilege.ALLOW
        decoded_privilege["edit_privilege"] = ModelPrivilege.ALLOW

        # update privilege
        response = self.rest_update_privilege(
            self.token2, "files", decoded_file["pk"], self.user1.pk, decoded_privilege, HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # unlock file with user2
        response = self.unlock(self.token2, "files", decoded_file["pk"], HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # now let user1 move the file into the drive (should work)
        response = self.rest_update_file_set_directory(
            self.token1, decoded_file["pk"], decoded_directory["pk"], HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # get all files within this drive (should be one)
        response = self.rest_drive_get_files(self.token1, str(drive.pk), HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        decoded_files = json.loads(response.content.decode())
        decoded_files = test_utils.get_paginated_results(decoded_files)
        self.assertEqual(len(decoded_files), 1)

        # now let user2 remove the file from the drive (should not work)
        response = self.rest_update_file_set_directory(
            self.token2, decoded_file["pk"], None, HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        # get all files within this drive (should still be one)
        response = self.rest_drive_get_files(self.token1, str(drive.pk), HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        decoded_files = json.loads(response.content.decode())
        decoded_files = test_utils.get_paginated_results(decoded_files)
        self.assertEqual(len(decoded_files), 1)

    def test_can_not_assign_directory_if_directory_is_not_editable(self):
        """
        Tests that the current user can not assign a file to a directory that is not editable
        :return:
        """
        # create drive
        drive, response = self.create_drive_orm(self.token1, None, "Some title", HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # get root directory of the drive
        root_dir = drive.sub_directories.all()[0].pk

        # create a directory within the drive
        response = self.rest_drive_create_directory(
            self.token1, str(drive.pk), "My dir", root_dir, HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        decoded_directory = json.loads(response.content.decode())

        # get all files within this drive (should be none)
        response = self.rest_drive_get_files(self.token1, str(drive.pk), HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        decoded_files = json.loads(response.content.decode())
        decoded_files = test_utils.get_paginated_results(decoded_files)
        self.assertEqual(len(decoded_files), 0)

        # give user2 view privileges for the drive
        response = self.rest_create_privilege(
            self.token1, "drives", str(drive.pk), self.user2.pk, HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        decoded_privilege = json.loads(response.content.decode())

        # update privilege
        decoded_privilege["view_privilege"] = ModelPrivilege.ALLOW
        response = self.rest_update_privilege(
            self.token1, "drives", str(drive.pk), self.user2.pk, decoded_privilege, HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # create a file with user2
        response = self.rest_create_file(
            self.token2, None, "User2 file", "description", "my_file.txt", 1024, HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        decoded_file = json.loads(response.content.decode())

        # let user2 assign the file to the directory of drive of user1 (should not work)
        response = self.rest_update_file_set_directory(
            self.token2, decoded_file["pk"], decoded_directory["pk"], HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        # get all files within this drive (should be none)
        response = self.rest_drive_get_files(self.token1, str(drive.pk), HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        decoded_files = json.loads(response.content.decode())
        decoded_files = test_utils.get_paginated_results(decoded_files)
        self.assertEqual(len(decoded_files), 0)

    def test_download_directory_as_zipfile(self):
        """
        Creates a directory structure with multiple files in it, and then tries to download the directories
        as a zip file
        Directory structure should be like this:
        Drive 'My Drive'

        * Directory 'My Dir'

          * File 'My file' (my_file.txt)
          * Sub Directory 'My Subdir'

            * File 'Another file' (another_file.txt)

        :return:
        """
        # create drive
        drive, response = self.create_drive_orm(self.token1, None, "My Drive", HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # get root directory of the drive
        root_dir = drive.sub_directories.all()[0].pk

        # create a directory within the drive
        response = self.rest_drive_create_directory(
            self.token1, str(drive.pk), "My Dir", root_dir, HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        decoded_directory = json.loads(response.content.decode())

        # create a file
        response = self.rest_create_file(
            self.token1, None, "My file", "My description", "my_file.txt", 1024, HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        decoded_file = json.loads(response.content.decode())

        # assign file to directory
        response = self.rest_update_file_set_directory(
            self.token1, decoded_file["pk"], decoded_directory["pk"], HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # create another sub directory (with decoded_directory as parent)
        response = self.rest_drive_create_directory(
            self.token1, str(drive.pk), "My Subdir", decoded_directory["pk"], HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        decoded_sub_directory = json.loads(response.content.decode())

        # create another file
        response = self.rest_create_file(
            self.token1,
            None,
            "Another file",
            "Some other description",
            "another_file.txt",
            1024,
            HTTP_USER_AGENT,
            REMOTE_ADDR,
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        decoded_another_file = json.loads(response.content.decode())

        # assign another file to the sub directory
        response = self.rest_update_file_set_directory(
            self.token1, decoded_another_file["pk"], decoded_sub_directory["pk"], HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # we should now have the desired structure - try to download the first directory "My Dir" (decoded_directory)
        response = self.rest_drive_download_directory(
            self.token1, str(drive.pk), decoded_directory["pk"], HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        from io import BytesIO
        from zipfile import ZipFile

        zipfile = ZipFile(BytesIO(b"".join(response.streaming_content)))

        zipfile_names = zipfile.namelist()

        # there should be two files in that list
        self.assertEqual(len(zipfile_names), 2)

        # one of them should be "My Subdir/*.another-file.txt", the other one should be "*.my_file.txt"
        all_file_names = ",".join(zipfile_names)

        self.assertTrue("My Subdir/" in all_file_names)
        self.assertTrue("another_file.txt" in all_file_names)
        self.assertTrue("my_file.txt" in all_file_names)

    def test_drives_with_special_characters(self):
        """
        Special characters such as / - äöü will cause problems with webdav urls
        :return:
        """
        response = self.rest_create_drive(self.token1, None, "a - b", HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        decoded_response = json.loads(response.content.decode())
        self.assertNotEqual(len(decoded_response["webdav_url"]), 0, msg="Make sure the webdav url is not empty")

        response = self.rest_create_drive(self.token1, None, "äöü", HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        decoded_response = json.loads(response.content.decode())
        self.assertNotEqual(len(decoded_response["webdav_url"]), 0, msg="Make sure the webdav url is not empty")

        response = self.rest_create_drive(self.token1, None, "a/b", HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        decoded_response = json.loads(response.content.decode())
        self.assertNotEqual(len(decoded_response["webdav_url"]), 0, msg="Make sure the webdav url is not empty")

        response = self.rest_create_drive(self.token1, None, "---", HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        decoded_response = json.loads(response.content.decode())
        self.assertNotEqual(len(decoded_response["webdav_url"]), 0, msg="Make sure the webdav url is not empty")

        # finally, try to retrieve all drives and see if that works
        response = self.rest_get_drives(self.token1, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        decoded_response = json.loads(response.content.decode())
        self.assertEqual(len(decoded_response), 4)
