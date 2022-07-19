#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import json
import os

from django.contrib.auth.models import Permission
from rest_framework import status
from rest_framework.test import APITestCase

from eric.core.tests import test_utils, HTTP_USER_AGENT, REMOTE_ADDR
from eric.model_privileges.models import ModelPrivilege
from eric.projects.models import Project
from eric.projects.tests.mixin_entity_generic_tests import EntityChangeRelatedProjectTestMixin
from eric.shared_elements.models import File
from eric.shared_elements.tests.core import FileMixin
from eric.versions.models import Version


class TestGenericsFiles(APITestCase, EntityChangeRelatedProjectTestMixin, FileMixin):
    entity = File

    def setUp(self):
        self.superSetUp()

        self.data = [{
            'file_title': "Demo file 1",
            'file_description': "<p>This is a demo file 1</p>",
            'file_name': "demo_file1.txt",
            'file_size': 1024,
            'project_pks': None
        }, {
            'file_title': "Demo file 2",
            'file_description': "<p>This is a demo file 2</p>",
            'file_name': "demo_file2.txt",
            'file_size': 2048,
            'project_pks': None,
        }]

        # get add_file and add_file_without_project permission
        self.add_file_permission = Permission.objects.filter(
            codename='add_file',
            content_type=File.get_content_type()
        ).first()

        self.add_file_without_project_permission = Permission.objects.filter(
            codename='add_file_without_project',
            content_type=File.get_content_type()
        ).first()

        self.student_role = self.create_student_role()

    def test_download_file_with_permission(self):
        """ Tests the download file endpoint """
        project = self.create_project(self.token1, "My Own Project", "Nobody else has access to this project",
                                      Project.STARTED, HTTP_USER_AGENT, REMOTE_ADDR)

        # get all files from rest api for this project
        response = self.rest_get_files_for_project(self.token1, project.pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # check the response
        decoded = json.loads(response.content.decode())
        decoded = test_utils.get_paginated_results(decoded)
        # should contain exactly no files
        self.assertEqual(len(decoded), 0)

        # create a file with 1024 bytes
        response = self.rest_create_file(self.token1, project.pk, 'Test Title', 'Test Description',
                                         'somefile.txt', 1024, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # decode response
        decoded = json.loads(response.content.decode())
        # get file object from db
        file = File.objects.get(pk=decoded['pk'])

        # Download file
        response = self.rest_download_file(self.token1, file.file_entries.last().pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.get('Content-Type'), 'text/plain;')
        self.assertTrue('attachment; filename=' in response.get('Content-Disposition'))

        # get all files from rest api for this project
        response = self.rest_get_files_for_project(self.token1, project.pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # update first file and check file_entries
        response = self.rest_update_file(self.token1, file.pk, project.pk, 'Test Title', 'Test Description',
                                         'yetanother.txt', 2048, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # decode response
        decoded = json.loads(response.content.decode())
        # get file object from db
        file = File.objects.get(pk=decoded['pk'])
        self.assertEqual(file.title, 'Test Title')
        self.assertEqual(file.file_size, 2048)
        # check file entries (= history)
        self.assertEqual(len(file.file_entries.all()), 2)
        self.assertEqual(file.file_entries.all()[0].file_size + file.file_entries.all()[1].file_size, 1024 + 2048)

        # Download file entry 0
        response = self.rest_download_file(self.token1, file.file_entries.all()[0].pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.get('Content-Type'), 'text/plain;')
        self.assertTrue('attachment; filename=' in response.get('Content-Disposition'))

        # Download file entry 1
        response = self.rest_download_file(self.token1, file.file_entries.all()[1].pk,
                                           HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.get('Content-Type'), 'text/plain;')
        self.assertTrue('attachment; filename=' in response.get('Content-Disposition'))

        # try to to do the same with another user which does not have access to the project
        response = self.rest_download_file(self.token2, file.file_entries.all()[0].pk,
                                           HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

        # add the user to the project without file download permission
        response = self.rest_assign_user_to_project(self.token1, project, self.user2, self.student_role,
                                                    HTTP_USER_AGENT, REMOTE_ADDR)
        assignment = json.loads(response.content.decode())

        response = self.rest_download_file(self.token2, file.file_entries.all()[0].pk,
                                           HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

        # make the user a project manager
        self.rest_edit_user_project_assignment(self.token1, project, assignment['pk'], self.user2, self.pm_role,
                                               HTTP_USER_AGENT, REMOTE_ADDR)

        response = self.rest_download_file(self.token2, file.file_entries.all()[0].pk,
                                           HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_create_file_with_and_without_permission(self):
        """
        Tests creating a file with and without the appropriate permission
        :return:
        """
        # there should be zero files to begin with
        self.assertEquals(File.objects.all().count(), 0, msg="There should be zero files to begin with")

        # try creating a file without a project and without having the proper permission
        response = self.rest_create_file(self.token3, None, 'Test Title', 'Test Description',
                                         'somefile.txt', 1024, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertIn(response.status_code, [status.HTTP_403_FORBIDDEN, status.HTTP_400_BAD_REQUEST])

        # there should still be zero files
        self.assertEquals(File.objects.all().count(), 0, msg="There should still be zero files")

        # however, creating a file for a project1 should work, as user1 has created project1 (and therefore should have
        # the needed permissions)
        response = self.rest_create_file(self.token3, self.project1.pk, 'Test Title', 'Test Description',
                                         'somefile.txt', 1024, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # now give the user the global add_file permission
        self.user3.user_permissions.add(self.add_file_without_project_permission)

        # try creating a file without a project now, and it should work
        response = self.rest_create_file(self.token3, None, 'Test Title', 'Test Description',
                                         'somefile.txt', 1024, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # there should now be two files
        self.assertEquals(File.objects.all().count(), 2, msg="There should be two files in the database")

        # and those two should be viewable by the current user
        response = self.rest_get_files(self.token3, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # check the response
        decoded = json.loads(response.content.decode())
        decoded = test_utils.get_paginated_results(decoded)
        # should contain exactly no files
        self.assertEqual(len(decoded), 2, msg="There should be two files viewable by the user")

        # revoke add_file_permission of user
        self.user3.user_permissions.remove(self.add_file_permission)
        # and give the user the add_file_without_project permission
        self.user3.user_permissions.add(self.add_file_without_project_permission)

        # try creating a file without a project now, and it should work
        response = self.rest_create_file(self.token3, None, 'Test Title', 'Test Description',
                                         'somefile.txt', 1024, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # there should now be three files
        self.assertEquals(File.objects.all().count(), 3, msg="There should be three files in the database")

        # and those two should be viewable by the current user
        response = self.rest_get_files(self.token3, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # check the response
        decoded = json.loads(response.content.decode())
        decoded = test_utils.get_paginated_results(decoded)
        # should contain exactly no files
        self.assertEqual(len(decoded), 3, msg="There should be three files viewable by the user")

    def test_duplicate_file(self):
        """
        Tests that duplicating a file with "path"="pk-of-other-file" works only for files that the current user has
        access to
        :return:
        """
        # create file1 with user1
        response = self.rest_generic_create_entity(self.token1, 0)
        file1 = json.loads(response.content.decode())

        # create file2 with user2
        response = self.rest_generic_create_entity(self.token2, 1)
        file2 = json.loads(response.content.decode())

        self.assertEquals(File.objects.all().count(), 2, msg="there should be two files")

        # try to duplicate file2 with user1 (should not work)
        response = self.rest_duplicate_file(self.token1, None, "Duplicate title", "some description", file2['pk'],
                                            HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_404_NOT_FOUND)

        self.assertEquals(File.objects.all().count(), 2, msg="there should still be two files")

        # try to duplicate file1 with user2 (should not work)
        response = self.rest_duplicate_file(self.token2, None, "Duplicate title", "some description", file1['pk'],
                                            HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_404_NOT_FOUND)

        self.assertEquals(File.objects.all().count(), 2, msg="there should still be two files")

        # give user1 view privileges on file2
        response = self.rest_generic_create_privilege(self.token2, file2['pk'], self.user1.pk)
        self.assertEquals(response.status_code, status.HTTP_201_CREATED)

        response = self.rest_generic_patch_privilege(self.token2, file2['pk'], self.user1.pk, {
            'view_privilege': ModelPrivilege.ALLOW
        })
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # now user 1 should be able to duplicate file2
        response = self.rest_duplicate_file(self.token1, None, "Duplicate title", "some description", file2['pk'],
                                            HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_201_CREATED)

        self.assertEquals(File.objects.all().count(), 3, msg="there should now be three files")

    def test_create_file_with_unicode_characters(self):
        """
        Tries to create a file with unicode characters in the filename
        Also tries to download this file, which should (according to RFC 5987) work and contain two headers
        """

        # try creating a file without a project and without having the proper permission
        response = self.rest_create_file(self.token1, None, 'Test Title', 'Test Description',
                                         'some😀😎file.txt', 1024, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_201_CREATED)

        # decode response
        decoded = json.loads(response.content.decode())
        # get file object from db
        file = File.objects.get(pk=decoded['pk'])

        response = self.rest_download_file(self.token1, file.file_entries.all()[0].pk,
                                           HTTP_USER_AGENT, REMOTE_ADDR)
        # check headers
        self.assertTrue("filename*=UTF-8" in response.headers['content-disposition'])

    def test_on_delete_file_also_delete_the_physical_files(self):
        """
        Tries to delete a file, which should also delete the physical representation of the files
        :return:
        """
        # create a file with 1024 bytes
        response = self.rest_create_file(self.token1, None, 'Test Title', 'Test Description',
                                         'somefile.txt', 1024, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # decode response
        decoded = json.loads(response.content.decode())
        # get file object from db
        file = File.objects.get(pk=decoded['pk'])

        filename = file.path.path

        self.assertTrue(os.path.exists(filename), msg="File should exist on disk")

        response = self.rest_trash_file(self.token1, file.pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        response = self.rest_delete_file(self.superuser_token, file.pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_204_NO_CONTENT)

        # now the file should not exist anymore
        self.assertFalse(os.path.exists(filename), msg="File should no longer exist on disk")

    def test_automatic_version_creation_on_file_update(self):
        """
        Updates a file, which should trigger the creation of an automatic version
        :return:
        """
        number_of_versions = Version.objects.all().count()
        self.assertEqual(number_of_versions, 0)

        # create a file
        response = self.rest_create_file(self.token1, None, 'Test Title', 'Test Description',
                                         'somefile.txt', 1024, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # decode response
        decoded = json.loads(response.content.decode())
        # get file object from db
        file = File.objects.get(pk=decoded['pk'])

        # update the file
        response = self.rest_update_file(self.token1, file.pk, None, 'Test Title', 'Test Description',
                                         'yetanother.txt', 2048, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        number_of_versions = Version.objects.all().count()
        self.assertEqual(number_of_versions, 1)

        version = Version.objects.all().last()
        self.assertEqual(version.summary, "File replaced: somefile.txt (auto-generated)")
