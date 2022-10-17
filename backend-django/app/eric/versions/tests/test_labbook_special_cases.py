#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from rest_framework.status import HTTP_200_OK, HTTP_201_CREATED, HTTP_404_NOT_FOUND
from rest_framework.test import APITestCase

from eric.labbooks.tests.core import LabBookMixin
from eric.projects.models import Project
from eric.projects.tests.core import AuthenticationMixin, ModelPrivilegeMixin, ProjectsMixin, TestLockMixin
from eric.shared_elements.models import Note
from eric.shared_elements.tests.core import NoteMixin
from eric.versions.tests import HTTP_USER_AGENT, REMOTE_ADDRESS, VersionData, get_json_content, http_info
from eric.versions.tests.helper_mixin import HelperMixin
from eric.versions.tests.rest_mixin import HttpInfo, VersionRestMixin


class LabBookVersionSpecialCasesTest(
    APITestCase,
    VersionRestMixin,
    ProjectsMixin,
    AuthenticationMixin,
    ModelPrivilegeMixin,
    HelperMixin,
    NoteMixin,
    LabBookMixin,
    TestLockMixin,
):
    """Tests special versioning cases unique to LabBooks"""

    def setUp(self):
        self.superuser, self.token = self.create_user_and_login("superuser", is_superuser=True)
        self.http_info = HttpInfo(auth_token=self.token, user_agent=HTTP_USER_AGENT, remote_address=REMOTE_ADDRESS)

        self.project = self.create_project(self.token, "MyProject", "My test project", Project.INITIALIZED, **http_info)

        self.labbook, response = self.create_labbook_orm(self.token, self.project.pk, "My labbook", False, **http_info)

        self.note, response = self.create_note_orm(
            self.token, self.project.pk, "My note", "My note content", **http_info
        )

        note_content_type_id = Note.get_content_type().id
        self.rest_add_labbook_element(
            self.token, self.labbook.pk, note_content_type_id, self.note.pk, 0, 0, 100, 100, **http_info
        )

        self.version_pk = self.create_version("labbooks", self.labbook.pk)

    def test_trashed_element_is_restored(self):
        "Tests that trashed sub-elements are restored, when a LabBook version is restored"

        # trash the element, and check that the trashing worked
        self.rest_trash_note(self.token, self.note.pk, **http_info)
        response = self.rest_get_note(self.token, self.note.pk, **http_info)
        self.assertEqual(True, get_json_content(response)["deleted"])

        # restore the version and check that it is not trashed anymore in the response
        response = self.restore_version("labbooks", self.labbook.pk, self.version_pk)
        self.assertEqual(False, get_json_content(response)["deleted"])

        # check that the element is not trashed anymore in the database
        response = self.rest_get_note(self.token, self.note.pk, **http_info)
        self.assertEqual(False, get_json_content(response)["deleted"])

    def test_trashed_element_is_still_trashed_after_preview(self):
        "Tests that elements that are restored for the preview are still trashed in the database afterwards"

        # trash the element, and check that the trashing worked
        self.rest_trash_note(self.token, self.note.pk, **http_info)
        response = self.rest_get_note(self.token, self.note.pk, **http_info)
        self.assertEqual(True, get_json_content(response)["deleted"])

        # preview the version, and check that is trashed in the preview
        self.preview_version("labbooks", self.labbook.pk, self.version_pk)
        self.assertEqual(True, get_json_content(response)["deleted"])

        # check that the element is still trashed in the database
        response = self.rest_get_note(self.token, self.note.pk, **http_info)
        self.assertEqual(True, get_json_content(response)["deleted"])

    def test_deleted_element_is_ignored(self):
        "Tests that the version-restore still works if some elements are hard-deleted \
        and that these elements are ignored"

        # hard-delete the element, and check that it is gone
        self.rest_trash_note(self.token, self.note.pk, **http_info)
        self.rest_delete_note(self.token, self.note.pk, **http_info)
        response = self.rest_get_note(self.token, self.note.pk, **http_info)
        self.assertEqual(response.status_code, HTTP_404_NOT_FOUND, response.content.decode())

        # restore the version and check that the element is not in the response
        response = self.restore_version("labbooks", self.labbook.pk, self.version_pk)
        child_elements = get_json_content(response)["child_elements"]
        self.assertEqual(0, len(child_elements))

        # check that the element is not in the database
        response = self.rest_get_note(self.token, self.note.pk, **http_info)
        self.assertEqual(response.status_code, HTTP_404_NOT_FOUND, response.content.decode())

        # check that the labbook-element is not in the database
        response = self.rest_get_labbook_elements(self.token, self.labbook.pk, **http_info)
        self.assertEqual(response.status_code, HTTP_200_OK, response.content.decode())
        child_elements = get_json_content(response)
        self.assertEqual(0, len(child_elements))

    def restore_version(self, endpoint, obj_pk, version_pk):
        response = self.rest_restore_version(endpoint, obj_pk, version_pk, self.http_info)
        self.assertEqual(response.status_code, HTTP_200_OK, response.content.decode())
        return response

    def preview_version(self, endpoint, obj_pk, version_pk):
        response = self.rest_preview_version(endpoint, obj_pk, version_pk, self.http_info)
        self.assertEqual(response.status_code, HTTP_200_OK, response.content.decode())
        return response

    def create_version(self, endpoint, pk):
        data = VersionData(object_id=pk, summary="My version").as_dict()
        response = self.rest_post_version(endpoint, pk, data, self.http_info)
        self.assertEqual(response.status_code, HTTP_201_CREATED)
        return get_json_content(response)["pk"]
