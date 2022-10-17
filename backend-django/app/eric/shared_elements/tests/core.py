#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import json
import os
import tempfile

from django.contrib.auth import get_user_model

from rest_framework import status

from eric.core.tests import HTTP_USER_AGENT, REMOTE_ADDR, custom_json_handler
from eric.projects.tests.core import TestLockMixin
from eric.shared_elements.models import Comment, Contact, File, Meeting, Note, Task

User = get_user_model()


def set_projects(data, pk_or_list):
    if pk_or_list:
        data["projects"] = get_pk_list(pk_or_list)


def get_pk_list(pk_or_list):
    return pk_or_list if isinstance(pk_or_list, list) else [pk_or_list]


class ElementLabelMixin:
    def rest_create_label(self, auth_token, label_name, label_color, HTTP_USER_AGENT, REMOTE_ADDR):
        """
        Wrapper for ceat
        :param auth_token:
        :param label_name:
        :param label_color:
        :param HTTP_USER_AGENT:
        :param REMOTE_ADDR:
        :return:
        """
        self.client.credentials(HTTP_AUTHORIZATION="Token " + auth_token)

        data = {"name": label_name, "color": label_color}

        response = self.client.post(
            "/api/element_labels/",
            json.dumps(data, default=custom_json_handler),
            content_type="application/json",
            HTTP_USER_AGENT=HTTP_USER_AGENT,
            REMOTE_ADDR=REMOTE_ADDR,
        )

        return response

    def rest_get_all_labels(self, auth_token, HTTP_USER_AGENT, REMOTE_ADDR):
        """
        Wrapper for getting all labels via REST API
        :param auth_token:
        :param HTTP_USER_AGENT:
        :param REMOTE_ADDR:
        :return:
        """
        self.client.credentials(HTTP_AUTHORIZATION="Token " + auth_token)

        response = self.client.get(
            "/api/element_labels/",
            content_type="application/json",
            HTTP_USER_AGENT=HTTP_USER_AGENT,
            REMOTE_ADDR=REMOTE_ADDR,
        )

        return response


class UserAttendsMeetingMixin:
    """Mixin which provides several wrapper methods for the
    api/meeting/meeting_pk/attending_users/update_users/ endpoint"""

    def update_attending_users(self, auth_token, meeting_id, user_id_list, HTTP_USER_AGENT, REMOTE_ADDR):
        """
        Wrapper for update attending users from a specific meeting
        """
        self.client.credentials(HTTP_AUTHORIZATION="Token " + auth_token)

        data = {"attending_users_pk": user_id_list}

        # Make a REST API call for update attending users from a specific meeting
        response = self.client.patch(
            f"/api/meetings/{meeting_id}/",
            json.dumps(data, default=custom_json_handler),
            content_type="application/json",
            HTTP_USER_AGENT=HTTP_USER_AGENT,
            REMOTE_ADDR=REMOTE_ADDR,
        )

        return response


class ContactAttendsMeetingMixin:
    """
    Mixin which provides several wrapper methods for the
    api/meeting/meeting_pk/attending_contact/update_contacts endpoint
    """

    def update_attending_contacts(self, auth_token, meeting_id, contact_id_list, HTTP_USER_AGENT, REMOTE_ADDR):
        """
        Wrapper for update attending users from a specific meeting
        """
        self.client.credentials(HTTP_AUTHORIZATION="Token " + auth_token)

        data = {"attending_contacts_pk": contact_id_list}

        # Make a REST API call for update attending contacts from a specific meeting
        response = self.client.patch(
            f"/api/meetings/{meeting_id}/",
            json.dumps(data, default=custom_json_handler),
            content_type="application/json",
            HTTP_USER_AGENT=HTTP_USER_AGENT,
            REMOTE_ADDR=REMOTE_ADDR,
        )

        return response


class CalendarAccessMixin:
    """
    Mixin which provides several wrapper methods for the
    api/meeting/meeting_pk/attending_contact/update_contacts endpoint
    """

    def update_attending_contacts(self, auth_token, meeting_id, contact_id_list, HTTP_USER_AGENT, REMOTE_ADDR):
        """
        Wrapper for update attending users from a specific meeting
        """
        self.client.credentials(HTTP_AUTHORIZATION="Token " + auth_token)

        data = {"attending_contacts_pk": contact_id_list}

        # Make a REST API call for update attending contacts from a specific meeting
        response = self.client.patch(
            f"/api/meetings/{meeting_id}/",
            json.dumps(data, default=custom_json_handler),
            content_type="application/json",
            HTTP_USER_AGENT=HTTP_USER_AGENT,
            REMOTE_ADDR=REMOTE_ADDR,
        )

        return response


class FileMixin(TestLockMixin):
    """
    Mixin which provides several wrapper methods for the /api/files/ endpoint
    """

    def rest_get_file_export_link(self, auth_token, task_pk, HTTP_USER_AGENT, REMOTE_ADDR):
        """
        Wrapper for getting the export link of a file
        """
        self.client.credentials(HTTP_AUTHORIZATION="Token " + auth_token)

        return self.client.get(
            f"/api/files/{task_pk}/get_export_link/", HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_search_files(self, auth_token, search_string, HTTP_USER_AGENT, REMOTE_ADDR):
        """
        Wrapper for searching the file endpoint
        """
        self.client.credentials(HTTP_AUTHORIZATION="Token " + auth_token)

        return self.client.get(
            f"/api/files/?search={search_string}", HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_get_files_recently_modified_by_me(self, auth_token, number_of_days, HTTP_USER_AGENT, REMOTE_ADDR):
        """
        Wrapper for showing only recently modified elements of the file endpoint
        """
        self.client.credentials(HTTP_AUTHORIZATION="Token " + auth_token)

        return self.client.get(
            f"/api/files/?recently_modified_by_me={number_of_days}",
            HTTP_USER_AGENT=HTTP_USER_AGENT,
            REMOTE_ADDR=REMOTE_ADDR,
        )

    def rest_get_file(self, auth_token, file_pk, HTTP_USER_AGENT, REMOTE_ADDR):
        """
        Wrapper for getting a file by its pk via REST API
        """
        self.client.credentials(HTTP_AUTHORIZATION="Token " + auth_token)

        return self.client.get(f"/api/files/{file_pk}/", HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR)

    def rest_get_files(self, auth_token, HTTP_USER_AGENT, REMOTE_ADDR):
        """
        Wrapper for getting a list of files that the current user has access to via REST API
        """
        self.client.credentials(HTTP_AUTHORIZATION="Token " + auth_token)

        return self.client.get("/api/files/", {}, HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR)

    def rest_get_files_for_project(self, auth_token, project_pk, HTTP_USER_AGENT, REMOTE_ADDR):
        """Wrapper for getting a list of files for a specific project via REST API (using filter
        ?project={project_pk})"""
        self.client.credentials(HTTP_AUTHORIZATION="Token " + auth_token)

        return self.client.get(
            "/api/files/", {"project": project_pk}, HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_download_file(self, auth_token, uploaded_file_entry_pk, HTTP_USER_AGENT, REMOTE_ADDR):
        """Wrapper for downloading a file via REST API"""
        self.client.credentials(HTTP_AUTHORIZATION="Token " + auth_token)

        return self.client.get(
            f"/api/files/{uploaded_file_entry_pk}/download/",
            {},
            HTTP_USER_AGENT=HTTP_USER_AGENT,
            REMOTE_ADDR=REMOTE_ADDR,
        )

    def rest_delete_file(self, auth_token, file_pk, HTTP_USER_AGENT, REMOTE_ADDR):
        """Wrapper for deleting a file via REST API"""
        self.client.credentials(HTTP_AUTHORIZATION="Token " + auth_token)

        return self.client.delete(f"/api/files/{file_pk}/", HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR)

    def rest_restore_file(self, auth_token, file_pk, HTTP_USER_AGENT, REMOTE_ADDR):
        """Wrapper for restoring a file via REST API"""
        self.client.credentials(HTTP_AUTHORIZATION="Token " + auth_token)

        return self.client.patch(
            f"/api/files/{file_pk}/restore/", HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_trash_file(self, auth_token, file_pk, HTTP_USER_AGENT, REMOTE_ADDR):
        """Wrapper for trashing a file via REST API"""
        self.client.credentials(HTTP_AUTHORIZATION="Token " + auth_token)

        return self.client.patch(
            f"/api/files/{file_pk}/soft_delete/", HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_update_file(
        self,
        auth_token,
        file_pk,
        project_pks,
        file_title,
        file_description,
        file_name,
        file_size,
        HTTP_USER_AGENT,
        REMOTE_ADDR,
    ):
        """Wrapper for creating a file via REST API"""
        self.client.credentials(HTTP_AUTHORIZATION="Token " + auth_token)

        # create a temporary file with random content
        tmp_file = tempfile.NamedTemporaryFile(suffix="." + file_name)
        tmp_file.write(os.urandom(file_size))
        tmp_file.seek(0)

        # open file and post it to the rest api
        fp = open(tmp_file.name, "rb")

        data = {"pk": file_pk, "title": file_title, "name": file_name, "description": file_description, "path": fp}

        set_projects(data, project_pks)

        return self.client.put(
            f"/api/files/{file_pk}/",
            data,
            format="multipart",  # needs to be multi part for file uploads
            HTTP_USER_AGENT=HTTP_USER_AGENT,
            REMOTE_ADDR=REMOTE_ADDR,
        )

    def rest_update_file_set_directory(self, auth_token, file_pk, directory_pk, HTTP_USER_AGENT, REMOTE_ADDR):
        """
        Wrapper for updating the directory of a file
        :param auth_token:
        :param file_pk:
        :param directory_pk:
        :param HTTP_USER_AGENT:
        :param REMOTE_ADDR:
        :return:
        """
        self.client.credentials(HTTP_AUTHORIZATION="Token " + auth_token)

        data = {"directory_id": directory_pk}

        return self.client.patch(
            f"/api/files/{file_pk}/",
            json.dumps(data, default=custom_json_handler),
            content_type="application/json",
            HTTP_USER_AGENT=HTTP_USER_AGENT,
            REMOTE_ADDR=REMOTE_ADDR,
        )

    def rest_update_file_project(self, auth_token, file_pk, project_pks, HTTP_USER_AGENT, REMOTE_ADDR):
        """
        Wrapper for updating the project of a file
        :param auth_token:
        :param task_pk:
        :param project_pks: list
        :param HTTP_USER_AGENT:
        :param REMOTE_ADDR:
        :return: response
        """
        self.client.credentials(HTTP_AUTHORIZATION="Token " + auth_token)

        data = {"projects": project_pks}

        return self.client.patch(
            f"/api/files/{file_pk}/",
            json.dumps(data, default=custom_json_handler),
            content_type="application/json",
            HTTP_USER_AGENT=HTTP_USER_AGENT,
            REMOTE_ADDR=REMOTE_ADDR,
        )

    def rest_duplicate_file(
        self, auth_token, project_pks, file_title, file_description, file_to_duplicate_pk, HTTP_USER_AGENT, REMOTE_ADDR
    ):
        """Wrapper for duplicating a file with the original file pk (file_to_duplicate_pk)"""
        self.client.credentials(HTTP_AUTHORIZATION="Token " + auth_token)

        data = {"title": file_title, "name": file_title, "description": file_description, "path": file_to_duplicate_pk}

        set_projects(data, project_pks)

        return self.client.post(
            "/api/files/",
            data,
            format="multipart",  # needs to be multi part for file uploads
            HTTP_USER_AGENT=HTTP_USER_AGENT,
            REMOTE_ADDR=REMOTE_ADDR,
        )

    def rest_create_file(
        self, auth_token, project_pks, file_title, file_description, file_name, file_size, HTTP_USER_AGENT, REMOTE_ADDR
    ):
        """Wrapper for creating a file via REST API"""
        self.client.credentials(HTTP_AUTHORIZATION="Token " + auth_token)

        # create a temporary file with random content
        tmp_file = tempfile.NamedTemporaryFile(suffix="." + file_name)
        tmp_file.write(os.urandom(file_size))
        tmp_file.seek(0)

        # open file and post it to the rest api
        fp = open(tmp_file.name, "rb")

        data = {"title": file_title, "name": file_name, "description": file_description, "path": fp}

        set_projects(data, project_pks)

        return self.client.post(
            "/api/files/",
            data,
            format="multipart",  # needs to be multi part for file uploads
            HTTP_USER_AGENT=HTTP_USER_AGENT,
            REMOTE_ADDR=REMOTE_ADDR,
        )

    def create_file_orm(
        self, auth_token, project_pk, title, description, file_name, file_size, HTTP_USER_AGENT, REMOTE_ADDR
    ):
        """Wrapper for rest_create_file which also returns a File Object from Djangos ORM"""

        response = self.rest_create_file(
            auth_token, project_pk, title, description, file_name, file_size, HTTP_USER_AGENT, REMOTE_ADDR
        )
        if response.status_code == status.HTTP_201_CREATED:
            decoded = json.loads(response.content.decode())
            return File.objects.get(pk=decoded["pk"]), response
        else:
            return None, response

    def rest_create_dss_file(
        self,
        auth_token,
        project_pks,
        file_title,
        file_description,
        file_name,
        file_size,
        directory_id,
        imported,
        HTTP_USER_AGENT,
        REMOTE_ADDR,
    ):
        """Wrapper for creating a dss file via REST API"""
        self.client.credentials(HTTP_AUTHORIZATION="Token " + auth_token)

        # create a temporary file with random content
        tmp_file = tempfile.NamedTemporaryFile(suffix="." + file_name)
        tmp_file.write(os.urandom(file_size))
        tmp_file.seek(0)

        # open file and post it to the rest api
        fp = open(tmp_file.name, "rb")

        data = {
            "title": file_title,
            "name": file_name,
            "description": file_description,
            "path": fp,
            "directory_id": directory_id,
            "imported": imported,
        }

        set_projects(data, project_pks)

        return self.client.post(
            "/api/files/",
            data,
            format="multipart",  # needs to be multi part for file uploads
            HTTP_USER_AGENT=HTTP_USER_AGENT,
            REMOTE_ADDR=REMOTE_ADDR,
        )


class NoteMixin(TestLockMixin):
    """
    Mixin which provides several wrapper methods for the /api/notes endpoint
    """

    def rest_get_note_export_link(self, auth_token, note_pk, HTTP_USER_AGENT, REMOTE_ADDR):
        """
        Wrapper for getting the export link of a note
        """
        self.client.credentials(HTTP_AUTHORIZATION="Token " + auth_token)

        return self.client.get(
            f"/api/notes/{note_pk}/get_export_link/", HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_search_notes(self, auth_token, search_string, HTTP_USER_AGENT, REMOTE_ADDR):
        """
        Wrapper for searching the note endpoint
        """
        self.client.credentials(HTTP_AUTHORIZATION="Token " + auth_token)

        return self.client.get(
            f"/api/notes/?search={search_string}", HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_get_notes_recently_modified_by_me(self, auth_token, number_of_days, HTTP_USER_AGENT, REMOTE_ADDR):
        """
        Wrapper for showing only recently modified elements of the note endpoint
        """
        self.client.credentials(HTTP_AUTHORIZATION="Token " + auth_token)

        return self.client.get(
            f"/api/notes/?recently_modified_by_me={number_of_days}",
            HTTP_USER_AGENT=HTTP_USER_AGENT,
            REMOTE_ADDR=REMOTE_ADDR,
        )

    def rest_get_note(self, auth_token, note_pk, HTTP_USER_AGENT, REMOTE_ADDR):
        """
        Wrapper for getting a note by its pk via REST API
        """
        self.client.credentials(HTTP_AUTHORIZATION="Token " + auth_token)

        return self.client.get(f"/api/notes/{note_pk}/", HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR)

    def rest_get_notes(self, auth_token, HTTP_USER_AGENT, REMOTE_ADDR):
        """
        Wrapper for getting a list of notes that the current user has access to via REST API
        """
        self.client.credentials(HTTP_AUTHORIZATION="Token " + auth_token)

        return self.client.get("/api/notes/", {}, HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR)

    def rest_get_notes_for_project(self, auth_token, project_pk, HTTP_USER_AGENT, REMOTE_ADDR):
        """Wrapper for getting a list of notes for a specific project via REST API (using filter
        ?project={project_pk})"""
        self.client.credentials(HTTP_AUTHORIZATION="Token " + auth_token)

        return self.client.get(
            "/api/notes/", {"project": project_pk}, HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_delete_note(self, auth_token, note_pk, HTTP_USER_AGENT, REMOTE_ADDR):
        """Wrapper for deleting a note via REST API"""
        self.client.credentials(HTTP_AUTHORIZATION="Token " + auth_token)

        return self.client.delete(f"/api/notes/{note_pk}/", HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR)

    def rest_restore_note(self, auth_token, note_pk, HTTP_USER_AGENT, REMOTE_ADDR):
        """Wrapper for restoring a note via REST API"""
        self.client.credentials(HTTP_AUTHORIZATION="Token " + auth_token)

        return self.client.patch(
            f"/api/notes/{note_pk}/restore/", HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_trash_note(self, auth_token, note_pk, HTTP_USER_AGENT, REMOTE_ADDR):
        """Wrapper for trashing a note via REST API"""
        self.client.credentials(HTTP_AUTHORIZATION="Token " + auth_token)

        return self.client.patch(
            f"/api/notes/{note_pk}/soft_delete/", HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_update_note(self, auth_token, note_pk, project_pks, subject, content, HTTP_USER_AGENT, REMOTE_ADDR):
        """Wrapper for creating a file via REST API"""
        self.client.credentials(HTTP_AUTHORIZATION="Token " + auth_token)

        data = {
            "subject": subject,
            "content": content,
        }

        set_projects(data, project_pks)

        return self.client.put(
            f"/api/notes/{note_pk}/",
            json.dumps(data, default=custom_json_handler),
            content_type="application/json",
            HTTP_USER_AGENT=HTTP_USER_AGENT,
            REMOTE_ADDR=REMOTE_ADDR,
        )

    def rest_update_note_project(self, auth_token, note_pk, project_pks, HTTP_USER_AGENT, REMOTE_ADDR):
        """
        Wrapper for updating the project of a note
        :param auth_token:
        :param task_pk:
        :param project_pks: list
        :param HTTP_USER_AGENT:
        :param REMOTE_ADDR:
        :return: response
        """
        self.client.credentials(HTTP_AUTHORIZATION="Token " + auth_token)

        data = {"projects": project_pks}

        return self.client.patch(
            f"/api/notes/{note_pk}/",
            json.dumps(data, default=custom_json_handler),
            content_type="application/json",
            HTTP_USER_AGENT=HTTP_USER_AGENT,
            REMOTE_ADDR=REMOTE_ADDR,
        )

    def rest_create_note(self, auth_token, project_pks, subject, content, HTTP_USER_AGENT, REMOTE_ADDR):
        """Wrapper for creating a file via REST API"""
        self.client.credentials(HTTP_AUTHORIZATION="Token " + auth_token)

        data = {
            "subject": subject,
            "content": content,
        }

        set_projects(data, project_pks)

        return self.client.post(
            "/api/notes/",
            json.dumps(data, default=custom_json_handler),
            content_type="application/json",
            HTTP_USER_AGENT=HTTP_USER_AGENT,
            REMOTE_ADDR=REMOTE_ADDR,
        )

    def create_note_orm(self, auth_token, project_pk, subject, content, HTTP_USER_AGENT, REMOTE_ADDR):
        """Wrapper for rest_create_note which also returns a Task Object from Djangos ORM"""

        response = self.rest_create_note(auth_token, project_pk, subject, content, HTTP_USER_AGENT, REMOTE_ADDR)
        if response.status_code == status.HTTP_201_CREATED:
            decoded = json.loads(response.content.decode())
            return Note.objects.get(pk=decoded["pk"]), response
        else:
            return None, response


class CommentMixin(TestLockMixin):
    """
    Mixin which provides several wrapper methods for the /api/comments endpoint
    """

    def rest_get_comment_export_link(self, auth_token, comment_pk, HTTP_USER_AGENT, REMOTE_ADDR):
        """
        Wrapper for getting the export link of a comment
        """
        self.client.credentials(HTTP_AUTHORIZATION="Token " + auth_token)

        return self.client.get(
            f"/api/comments/{comment_pk}/get_export_link/",
            HTTP_USER_AGENT=HTTP_USER_AGENT,
            REMOTE_ADDR=REMOTE_ADDR,
        )

    def rest_search_comments(self, auth_token, search_string, HTTP_USER_AGENT, REMOTE_ADDR):
        """
        Wrapper for searching the comment endpoint
        """
        self.client.credentials(HTTP_AUTHORIZATION="Token " + auth_token)

        return self.client.get(
            f"/api/comments/?search={search_string}", HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_get_comments_recently_modified_by_me(self, auth_token, number_of_days, HTTP_USER_AGENT, REMOTE_ADDR):
        """
        Wrapper for showing only recently modified elements of the comment endpoint
        """
        self.client.credentials(HTTP_AUTHORIZATION="Token " + auth_token)

        return self.client.get(
            f"/api/comments/?recently_modified_by_me={number_of_days}",
            HTTP_USER_AGENT=HTTP_USER_AGENT,
            REMOTE_ADDR=REMOTE_ADDR,
        )

    def rest_get_comment(self, auth_token, comment_pk, HTTP_USER_AGENT, REMOTE_ADDR):
        """
        Wrapper for getting a comment by its pk via REST API
        """
        self.client.credentials(HTTP_AUTHORIZATION="Token " + auth_token)

        return self.client.get(f"/api/comments/{comment_pk}/", HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR)

    def rest_get_comments(self, auth_token, HTTP_USER_AGENT, REMOTE_ADDR):
        """
        Wrapper for getting a list of comments that the current user has access to via REST API
        """
        self.client.credentials(HTTP_AUTHORIZATION="Token " + auth_token)

        return self.client.get("/api/comments/", {}, HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR)

    def rest_get_comments_for_project(self, auth_token, project_pk, HTTP_USER_AGENT, REMOTE_ADDR):
        """Wrapper for getting a list of comments for a specific project via REST API (using filter
        ?project={project_pk})"""
        self.client.credentials(HTTP_AUTHORIZATION="Token " + auth_token)

        return self.client.get(
            "/api/comments/", {"project": project_pk}, HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_delete_comment(self, auth_token, comment_pk, HTTP_USER_AGENT, REMOTE_ADDR):
        """Wrapper for deleting a comment via REST API"""
        self.client.credentials(HTTP_AUTHORIZATION="Token " + auth_token)

        return self.client.delete(
            f"/api/comments/{comment_pk}/", HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_restore_comment(self, auth_token, comment_pk, HTTP_USER_AGENT, REMOTE_ADDR):
        """Wrapper for restoring a comment via REST API"""
        self.client.credentials(HTTP_AUTHORIZATION="Token " + auth_token)

        return self.client.patch(
            f"/api/comments/{comment_pk}/restore/",
            HTTP_USER_AGENT=HTTP_USER_AGENT,
            REMOTE_ADDR=REMOTE_ADDR,
        )

    def rest_trash_comment(self, auth_token, comment_pk, HTTP_USER_AGENT, REMOTE_ADDR):
        """Wrapper for trashing a comment via REST API"""
        self.client.credentials(HTTP_AUTHORIZATION="Token " + auth_token)

        return self.client.patch(
            f"/api/comments/{comment_pk}/soft_delete/",
            HTTP_USER_AGENT=HTTP_USER_AGENT,
            REMOTE_ADDR=REMOTE_ADDR,
        )

    def rest_update_comment(self, auth_token, comment_pk, project_pks, content, HTTP_USER_AGENT, REMOTE_ADDR):
        """Wrapper for creating a file via REST API"""
        self.client.credentials(HTTP_AUTHORIZATION="Token " + auth_token)

        data = {
            "content": content,
        }

        set_projects(data, project_pks)

        return self.client.put(
            f"/api/comments/{comment_pk}/",
            json.dumps(data, default=custom_json_handler),
            content_type="application/json",
            HTTP_USER_AGENT=HTTP_USER_AGENT,
            REMOTE_ADDR=REMOTE_ADDR,
        )

    def rest_update_comment_project(self, auth_token, comment_pk, project_pks, HTTP_USER_AGENT, REMOTE_ADDR):
        """
        Wrapper for updating the project of a comment
        :param auth_token:
        :param comment_pk:
        :param project_pks: list
        :param HTTP_USER_AGENT:
        :param REMOTE_ADDR:
        :return: response
        """
        self.client.credentials(HTTP_AUTHORIZATION="Token " + auth_token)

        data = {"projects": project_pks}

        return self.client.patch(
            f"/api/comments/{comment_pk}/",
            json.dumps(data, default=custom_json_handler),
            content_type="application/json",
            HTTP_USER_AGENT=HTTP_USER_AGENT,
            REMOTE_ADDR=REMOTE_ADDR,
        )

    def rest_create_comment(self, auth_token, project_pks, content, HTTP_USER_AGENT, REMOTE_ADDR):
        """Wrapper for creating a file via REST API"""
        self.client.credentials(HTTP_AUTHORIZATION="Token " + auth_token)

        data = {
            "content": content,
        }

        set_projects(data, project_pks)

        return self.client.post(
            "/api/comments/",
            json.dumps(data, default=custom_json_handler),
            content_type="application/json",
            HTTP_USER_AGENT=HTTP_USER_AGENT,
            REMOTE_ADDR=REMOTE_ADDR,
        )

    def create_comment_orm(self, auth_token, project_pk, content, HTTP_USER_AGENT, REMOTE_ADDR):
        """Wrapper for rest_create_comment which also returns a Task Object from Djangos ORM"""

        response = self.rest_create_comment(auth_token, project_pk, content, HTTP_USER_AGENT, REMOTE_ADDR)
        if response.status_code == status.HTTP_201_CREATED:
            decoded = json.loads(response.content.decode())
            return Comment.objects.get(pk=decoded["pk"]), response
        else:
            return None, response


class TaskMixin(TestLockMixin):
    """
    Mixin which provides several wrapper methods for the /api/tasks/ endpoint
    """

    def rest_get_task_export_link(self, auth_token, task_pk, HTTP_USER_AGENT, REMOTE_ADDR):
        """
        Wrapper for getting the export link of a task
        """
        self.client.credentials(HTTP_AUTHORIZATION="Token " + auth_token)

        return self.client.get(
            f"/api/tasks/{task_pk}/get_export_link/", HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_search_tasks(self, auth_token, search_string, HTTP_USER_AGENT, REMOTE_ADDR):
        """
        Wrapper for searching the task endpoint
        """
        self.client.credentials(HTTP_AUTHORIZATION="Token " + auth_token)

        return self.client.get(
            f"/api/tasks/?search={search_string}", HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_get_tasks_recently_modified_by_me(self, auth_token, number_of_days, HTTP_USER_AGENT, REMOTE_ADDR):
        """
        Wrapper for showing only recently modified elements of the task endpoint
        """
        self.client.credentials(HTTP_AUTHORIZATION="Token " + auth_token)

        return self.client.get(
            f"/api/tasks/?recently_modified_by_me={number_of_days}",
            HTTP_USER_AGENT=HTTP_USER_AGENT,
            REMOTE_ADDR=REMOTE_ADDR,
        )

    def rest_get_task(self, auth_token, task_pk, HTTP_USER_AGENT, REMOTE_ADDR):
        """
        Wrapper for getting a task by its pk via REST API
        """
        self.client.credentials(HTTP_AUTHORIZATION="Token " + auth_token)

        return self.client.get(f"/api/tasks/{task_pk}/", HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR)

    def rest_get_tasks(self, auth_token, HTTP_USER_AGENT, REMOTE_ADDR):
        """
        Wrapper for getting a list of tasks that the current user has access to via REST API
        """
        self.client.credentials(HTTP_AUTHORIZATION="Token " + auth_token)

        return self.client.get("/api/tasks/", {}, HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR)

    def rest_get_tasks_for_project(self, auth_token, project_pk, HTTP_USER_AGENT, REMOTE_ADDR):
        """Wrapper for getting a list of tasks for a specific project via REST API (using filter
        ?project={project_pk})"""
        self.client.credentials(HTTP_AUTHORIZATION="Token " + auth_token)

        return self.client.get(
            "/api/tasks/", {"project": project_pk}, HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_delete_task(self, auth_token, task_pk, HTTP_USER_AGENT, REMOTE_ADDR):
        """Wrapper for deleting a task via REST API"""
        self.client.credentials(HTTP_AUTHORIZATION="Token " + auth_token)

        return self.client.delete(f"/api/tasks/{task_pk}/", HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR)

    def rest_restore_task(self, auth_token, task_pk, HTTP_USER_AGENT, REMOTE_ADDR):
        """Wrapper for restoring a task via REST API"""
        self.client.credentials(HTTP_AUTHORIZATION="Token " + auth_token)

        return self.client.patch(
            f"/api/tasks/{task_pk}/restore/", HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_trash_task(self, auth_token, task_pk, HTTP_USER_AGENT, REMOTE_ADDR):
        """Wrapper for trashing a task via REST API"""
        self.client.credentials(HTTP_AUTHORIZATION="Token " + auth_token)

        return self.client.patch(
            f"/api/tasks/{task_pk}/soft_delete/", HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_update_task_partial(self, auth_token, task_pk, data, HTTP_USER_AGENT, REMOTE_ADDR):
        """
        Wrapper for updating a task using a patch request
        :param auth_token:
        :param task_pk:
        :param data:
        :param HTTP_USER_AGENT:
        :param REMOTE_ADDR:
        :return:
        """
        self.client.credentials(HTTP_AUTHORIZATION="Token " + auth_token)

        return self.client.patch(
            f"/api/tasks/{task_pk}/",
            json.dumps(data, default=custom_json_handler),
            content_type="application/json",
            HTTP_USER_AGENT=HTTP_USER_AGENT,
            REMOTE_ADDR=REMOTE_ADDR,
        )

    def rest_update_task(
        self,
        auth_token,
        task_pk,
        project_pks,
        title,
        description,
        state,
        priority,
        start_date,
        due_date,
        assigned_user,
        HTTP_USER_AGENT,
        REMOTE_ADDR,
    ):
        """Wrapper for updating a task via REST API"""
        self.client.credentials(HTTP_AUTHORIZATION="Token " + auth_token)

        if not isinstance(assigned_user, list):
            assigned_user = [assigned_user]

        data = {
            "title": title,
            "description": description,
            "state": state,
            "priority": priority,
            "start_date": start_date,
            "due_date": due_date,
            "assigned_users_pk": assigned_user,
        }

        set_projects(data, project_pks)

        return self.client.put(
            f"/api/tasks/{task_pk}/",
            json.dumps(data, default=custom_json_handler),
            content_type="application/json",
            HTTP_USER_AGENT=HTTP_USER_AGENT,
            REMOTE_ADDR=REMOTE_ADDR,
        )

    def rest_update_task_project(self, auth_token, task_pk, project_pks, HTTP_USER_AGENT, REMOTE_ADDR):
        """
        Wrapper for updating the project of a task
        :param auth_token:
        :param task_pk:
        :param project_pks: list
        :param HTTP_USER_AGENT:
        :param REMOTE_ADDR:
        :return: response
        """
        self.client.credentials(HTTP_AUTHORIZATION="Token " + auth_token)

        data = {"projects": project_pks}

        return self.client.patch(
            f"/api/tasks/{task_pk}/",
            json.dumps(data, default=custom_json_handler),
            content_type="application/json",
            HTTP_USER_AGENT=HTTP_USER_AGENT,
            REMOTE_ADDR=REMOTE_ADDR,
        )

    def rest_update_task_assigned_users(self, auth_token, task_pk, assigned_users, HTTP_USER_AGENT, REMOTE_ADDR):
        """
        Wrapper for updating the assigned user of a task via REST API (with a PATCH call)
        :param auth_token:
        :param task_pk:
        :param assigned_users:
        :return:
        """
        self.client.credentials(HTTP_AUTHORIZATION="Token " + auth_token)

        data = {"assigned_users_pk": assigned_users}

        return self.client.patch(
            f"/api/tasks/{task_pk}/",
            json.dumps(data, default=custom_json_handler),
            content_type="application/json",
            HTTP_USER_AGENT=HTTP_USER_AGENT,
            REMOTE_ADDR=REMOTE_ADDR,
        )

    def rest_update_task_checklist_items(self, auth_token, task_pk, checklist_items, HTTP_USER_AGENT, REMOTE_ADDR):
        """
        Wrapper for updating checklist items of a task via REST API (with a PATCH call)
        :param auth_token:
        :param task_pk:
        :param checklist_items:
        :param HTTP_USER_AGENT:
        :param REMOTE_ADDR:
        :return:
        """
        self.client.credentials(HTTP_AUTHORIZATION="Token " + auth_token)

        data = {"checklist_items": checklist_items}

        return self.client.patch(
            f"/api/tasks/{task_pk}/",
            json.dumps(data, default=custom_json_handler),
            content_type="application/json",
            HTTP_USER_AGENT=HTTP_USER_AGENT,
            REMOTE_ADDR=REMOTE_ADDR,
        )

    def rest_create_task(
        self,
        auth_token,
        project_pks,
        title,
        description,
        state,
        priority,
        start_date,
        due_date,
        assigned_user,
        HTTP_USER_AGENT,
        REMOTE_ADDR,
        checklist_items=None,
        remind_assignees=False,
        reminder_datetime=None,
    ):
        """Wrapper for creating a file via REST API"""
        self.client.credentials(HTTP_AUTHORIZATION="Token " + auth_token)

        if not isinstance(assigned_user, list):
            assigned_user = [assigned_user]

        data = {
            "title": title,
            "description": description,
            "state": state,
            "priority": priority,
            "start_date": start_date,
            "due_date": due_date,
            "assigned_users_pk": assigned_user,
        }

        if checklist_items:
            data["checklist_items"] = checklist_items

        if remind_assignees:
            data["remind_assignees"] = remind_assignees

        if reminder_datetime:
            data["reminder_datetime"] = reminder_datetime

        set_projects(data, project_pks)

        return self.client.post(
            "/api/tasks/",
            json.dumps(data, default=custom_json_handler),
            content_type="application/json",
            HTTP_USER_AGENT=HTTP_USER_AGENT,
            REMOTE_ADDR=REMOTE_ADDR,
        )

    def create_task_orm(
        self,
        auth_token,
        project_pk,
        title,
        description,
        state,
        priority,
        start_date,
        due_date,
        assigned_user,
        HTTP_USER_AGENT,
        REMOTE_ADDR,
    ):
        """Wrapper for rest_create_task which also returns a Task Object from Djangos ORM"""

        response = self.rest_create_task(
            auth_token,
            project_pk,
            title,
            description,
            state,
            priority,
            start_date,
            due_date,
            assigned_user,
            HTTP_USER_AGENT,
            REMOTE_ADDR,
        )
        if response.status_code == status.HTTP_201_CREATED:
            decoded = json.loads(response.content.decode())
            return Task.objects.get(pk=decoded["pk"]), response
        else:
            return None, response


class ContactMixin(TestLockMixin):
    """Mixin which provides several wrapper methods for the contacts (/api/contacts/) endpoint"""

    def rest_get_contact_export_link(self, auth_token, task_pk, HTTP_USER_AGENT, REMOTE_ADDR):
        """
        Wrapper for getting the export link of a contact
        """
        self.client.credentials(HTTP_AUTHORIZATION="Token " + auth_token)

        return self.client.get(
            f"/api/contacts/{task_pk}/get_export_link/",
            HTTP_USER_AGENT=HTTP_USER_AGENT,
            REMOTE_ADDR=REMOTE_ADDR,
        )

    def rest_search_contacts(self, auth_token, search_string, HTTP_USER_AGENT, REMOTE_ADDR):
        """
        Wrapper for searching the contact endpoint
        """
        self.client.credentials(HTTP_AUTHORIZATION="Token " + auth_token)

        return self.client.get(
            f"/api/contacts/?search={search_string}", HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_get_contacts_recently_modified_by_me(self, auth_token, number_of_days, HTTP_USER_AGENT, REMOTE_ADDR):
        """
        Wrapper for showing only recently modified elements of the contact endpoint
        """
        self.client.credentials(HTTP_AUTHORIZATION="Token " + auth_token)

        return self.client.get(
            f"/api/contacts/?recently_modified_by_me={number_of_days}",
            HTTP_USER_AGENT=HTTP_USER_AGENT,
            REMOTE_ADDR=REMOTE_ADDR,
        )

    def rest_get_contact(self, auth_token, contact_pk, HTTP_USER_AGENT, REMOTE_ADDR):
        """
        Wrapper for getting a contact by its pk via REST API
        """
        self.client.credentials(HTTP_AUTHORIZATION="Token " + auth_token)

        return self.client.get(f"/api/contacts/{contact_pk}/", HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR)

    def rest_get_contacts(self, auth_token, HTTP_USER_AGENT, REMOTE_ADDR):
        """
        Wrapper for getting a list of contacts that the current user has access to via REST API
        """
        self.client.credentials(HTTP_AUTHORIZATION="Token " + auth_token)

        return self.client.get("/api/contacts/", {}, HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR)

    def rest_create_contact(
        self,
        auth_token,
        project_pks,
        academic_title,
        firstname,
        lastname,
        email,
        HTTP_USER_AGENT,
        REMOTE_ADDR,
        company="",
        phone="",
    ):
        """
        Wrapper for creating a contact via REST API
        """
        self.client.credentials(HTTP_AUTHORIZATION="Token " + auth_token)

        data = {
            "academic_title": academic_title,
            "first_name": firstname,
            "last_name": lastname,
            "email": email,
            "company": company,
            "phone": phone,
        }

        set_projects(data, project_pks)

        response = self.client.post(
            "/api/contacts/",
            json.dumps(data, default=custom_json_handler),
            content_type="application/json",
            HTTP_USER_AGENT=HTTP_USER_AGENT,
            REMOTE_ADDR=REMOTE_ADDR,
        )
        return response

    def rest_delete_contact(self, auth_token, contact_pk, HTTP_USER_AGENT, REMOTE_ADDR):
        """Wrapper for deleting a contact via REST API"""
        self.client.credentials(HTTP_AUTHORIZATION="Token " + auth_token)

        return self.client.delete(
            f"/api/contacts/{contact_pk}/", HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_restore_contact(self, auth_token, contact_pk, HTTP_USER_AGENT, REMOTE_ADDR):
        """Wrapper for restoring a contact via REST API"""
        self.client.credentials(HTTP_AUTHORIZATION="Token " + auth_token)

        return self.client.patch(
            f"/api/contacts/{contact_pk}/restore/",
            HTTP_USER_AGENT=HTTP_USER_AGENT,
            REMOTE_ADDR=REMOTE_ADDR,
        )

    def rest_trash_contact(self, auth_token, contact_pk, HTTP_USER_AGENT, REMOTE_ADDR):
        """Wrapper for trashing a contact via REST API"""
        self.client.credentials(HTTP_AUTHORIZATION="Token " + auth_token)

        return self.client.patch(
            f"/api/contacts/{contact_pk}/soft_delete/",
            HTTP_USER_AGENT=HTTP_USER_AGENT,
            REMOTE_ADDR=REMOTE_ADDR,
        )

    def rest_update_contact(
        self,
        auth_token,
        contact_id,
        project_pks,
        academic_title,
        firstname,
        lastname,
        email,
        HTTP_USER_AGENT,
        REMOTE_ADDR,
        company="",
        phone="",
    ):
        """
        Wrapper for updateing a contact via REST API
        """
        self.client.credentials(HTTP_AUTHORIZATION="Token " + auth_token)

        data = {
            "academic_title": academic_title,
            "first_name": firstname,
            "last_name": lastname,
            "email": email,
            "company": company,
            "phone": phone,
        }

        set_projects(data, project_pks)

        response = self.client.put(
            f"/api/contacts/{contact_id}/",
            json.dumps(data, default=custom_json_handler),
            content_type="application/json",
            HTTP_USER_AGENT=HTTP_USER_AGENT,
            REMOTE_ADDR=REMOTE_ADDR,
        )
        return response

    def rest_update_contact_project(self, auth_token, contact_pk, project_pks, HTTP_USER_AGENT, REMOTE_ADDR):
        """
        Wrapper for updating the project of a note
        :param auth_token:
        :param contact_pk:
        :param project_pks: list
        :param HTTP_USER_AGENT:
        :param REMOTE_ADDR:
        :return: response
        """
        self.client.credentials(HTTP_AUTHORIZATION="Token " + auth_token)

        data = {"projects": project_pks}

        return self.client.patch(
            f"/api/contacts/{contact_pk}/",
            json.dumps(data, default=custom_json_handler),
            content_type="application/json",
            HTTP_USER_AGENT=HTTP_USER_AGENT,
            REMOTE_ADDR=REMOTE_ADDR,
        )

    def create_contact_orm(
        self,
        auth_token,
        project_pk,
        academic_title,
        first_name,
        last_name,
        email,
        HTTP_USER_AGENT,
        REMOTE_ADDR,
        company="",
        phone="",
    ):
        """Wrapper for rest_create_contact which also returns a Contact Object from Djangos ORM"""

        response = self.rest_create_contact(
            auth_token,
            project_pk,
            academic_title,
            first_name,
            last_name,
            email,
            HTTP_USER_AGENT,
            REMOTE_ADDR,
            company=company,
            phone=phone,
        )
        if response.status_code == status.HTTP_201_CREATED:
            decoded = json.loads(response.content.decode())
            return Contact.objects.get(pk=decoded["pk"]), response
        else:
            return None, response


class MeetingMixin(TestLockMixin):
    """Mixin which provides several wrapper methods for the meetings (/api/meetings/) endpoint"""

    def rest_get_meeting_export_link(self, auth_token, task_pk, HTTP_USER_AGENT, REMOTE_ADDR):
        """
        Wrapper for getting the export link of a meeting
        """
        self.client.credentials(HTTP_AUTHORIZATION="Token " + auth_token)

        return self.client.get(
            f"/api/meetings/{task_pk}/get_export_link/",
            HTTP_USER_AGENT=HTTP_USER_AGENT,
            REMOTE_ADDR=REMOTE_ADDR,
        )

    def rest_search_meetings(self, auth_token, search_string, HTTP_USER_AGENT, REMOTE_ADDR):
        """
        Wrapper for searching the meeting endpoint
        """
        self.client.credentials(HTTP_AUTHORIZATION="Token " + auth_token)

        return self.client.get(
            f"/api/meetings/?search={search_string}", HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_get_meetings_recently_modified_by_me(self, auth_token, number_of_days, HTTP_USER_AGENT, REMOTE_ADDR):
        """
        Wrapper for showing only recently modified elements of the meeting endpoint
        """
        self.client.credentials(HTTP_AUTHORIZATION="Token " + auth_token)

        return self.client.get(
            f"/api/meetings/?recently_modified_by_me={number_of_days}",
            HTTP_USER_AGENT=HTTP_USER_AGENT,
            REMOTE_ADDR=REMOTE_ADDR,
        )

    def rest_get_meeting(self, auth_token, meeting_pk, HTTP_USER_AGENT, REMOTE_ADDR):
        """
        Wrapper for getting a meeting by its pk via REST API
        """
        self.client.credentials(HTTP_AUTHORIZATION="Token " + auth_token)

        return self.client.get(f"/api/meetings/{meeting_pk}/", HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR)

    def rest_get_meetings(self, auth_token, HTTP_USER_AGENT, REMOTE_ADDR):
        """
        Wrapper for getting a list of meetings that the current user has access to via REST API
        """
        self.client.credentials(HTTP_AUTHORIZATION="Token " + auth_token)

        return self.client.get("/api/meetings/", {}, HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR)

    def rest_export_meetings(self, auth_token, HTTP_USER_AGENT, REMOTE_ADDR):
        """
        Wrapper for exporting a meeting via REST API
        """
        return self.client.get("/api/meetings/export/", HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR)

    def rest_create_resource_booking(
        self,
        auth_token,
        title,
        date_time_start,
        date_time_end,
        resource_pk,
        HTTP_USER_AGENT=HTTP_USER_AGENT,
        REMOTE_ADDR=REMOTE_ADDR,
        **kwargs,
    ):
        """
        Creates an appointment for a resource booking.
        """
        additional_args = {
            "description": "",
            "resource_pk": resource_pk,
            "project_pks": None,
        }
        additional_args.update(kwargs)

        return self.rest_create_meeting(
            auth_token=auth_token,
            title=title,
            start_date=date_time_start,
            end_date=date_time_end,
            HTTP_USER_AGENT=HTTP_USER_AGENT,
            REMOTE_ADDR=REMOTE_ADDR,
            **additional_args,
        )

    def rest_create_meeting(
        self,
        auth_token,
        project_pks,
        title,
        description,
        start_date,
        end_date,
        HTTP_USER_AGENT,
        REMOTE_ADDR,
        attending_users=None,
        attending_contacts=None,
        scheduled_notification_writable=None,
        **kwargs,
    ):
        """
        Wrapper for creating a meeting via REST API
        """
        self.client.credentials(HTTP_AUTHORIZATION="Token " + auth_token)

        data = {"title": title, "text": description, "date_time_start": start_date, "date_time_end": end_date}
        data.update(kwargs)

        set_projects(data, project_pks)

        if attending_users:
            data["attending_users_pk"] = attending_users
        if attending_contacts:
            data["attending_contacts_pk"] = attending_contacts
        if scheduled_notification_writable:
            data["scheduled_notification_writable"] = scheduled_notification_writable

        response = self.client.post(
            "/api/meetings/",
            json.dumps(data, default=custom_json_handler),
            content_type="application/json",
            HTTP_USER_AGENT=HTTP_USER_AGENT,
            REMOTE_ADDR=REMOTE_ADDR,
        )
        return response

    def rest_update_meeting_attending_users(
        self, auth_token, meeting_pk, attending_users, HTTP_USER_AGENT, REMOTE_ADDR
    ):
        """
        Wrapper for updating the attending users of a meeting via REST API
        :param auth_token:
        :param meeting_pk:
        :param assigned_users:
        :return:
        """
        self.client.credentials(HTTP_AUTHORIZATION="Token " + auth_token)

        data = {"attending_users_pk": attending_users}

        return self.client.patch(
            f"/api/meetings/{meeting_pk}/",
            json.dumps(data, default=custom_json_handler),
            content_type="application/json",
            HTTP_USER_AGENT=HTTP_USER_AGENT,
            REMOTE_ADDR=REMOTE_ADDR,
        )

    def rest_delete_meeting(self, auth_token, meeting_pk, HTTP_USER_AGENT, REMOTE_ADDR):
        """Wrapper for deleting a meeting via REST API"""
        self.client.credentials(HTTP_AUTHORIZATION="Token " + auth_token)

        return self.client.delete(
            f"/api/meetings/{meeting_pk}/", HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_restore_meeting(self, auth_token, meeting_pk, HTTP_USER_AGENT, REMOTE_ADDR):
        """Wrapper for restoring a meeting via REST API"""
        self.client.credentials(HTTP_AUTHORIZATION="Token " + auth_token)

        return self.client.patch(
            f"/api/meetings/{meeting_pk}/restore/",
            HTTP_USER_AGENT=HTTP_USER_AGENT,
            REMOTE_ADDR=REMOTE_ADDR,
        )

    def rest_trash_meeting(self, auth_token, meeting_pk, HTTP_USER_AGENT, REMOTE_ADDR):
        """Wrapper for trashing a meeting via REST API"""
        self.client.credentials(HTTP_AUTHORIZATION="Token " + auth_token)

        return self.client.patch(
            f"/api/meetings/{meeting_pk}/soft_delete/",
            HTTP_USER_AGENT=HTTP_USER_AGENT,
            REMOTE_ADDR=REMOTE_ADDR,
        )

    def rest_update_meeting(
        self,
        auth_token,
        meeting_id,
        project_pks,
        title,
        description,
        start_date,
        end_date,
        HTTP_USER_AGENT,
        REMOTE_ADDR,
    ):
        """
        Wrapper for updating a meeting via REST API
        """
        self.client.credentials(HTTP_AUTHORIZATION="Token " + auth_token)

        data = {"title": title, "text": description, "date_time_start": start_date, "date_time_end": end_date}

        set_projects(data, project_pks)

        response = self.client.put(
            f"/api/meetings/{meeting_id}/",
            json.dumps(data, default=custom_json_handler),
            content_type="application/json",
            HTTP_USER_AGENT=HTTP_USER_AGENT,
            REMOTE_ADDR=REMOTE_ADDR,
        )
        return response

    def rest_update_meeting_remove_resource(self, auth_token, meeting_pk, HTTP_USER_AGENT, REMOTE_ADDR):
        """
        Wrapper for removing the resource of a meeting
        :param auth_token:
        :param meeting_pk:
        :param HTTP_USER_AGENT:
        :param REMOTE_ADDR:
        :return: response
        """
        self.client.credentials(HTTP_AUTHORIZATION="Token " + auth_token)

        data = {"resource_pk": ""}

        return self.client.patch(
            f"/api/meetings/{meeting_pk}/",
            json.dumps(data, default=custom_json_handler),
            content_type="application/json",
            HTTP_USER_AGENT=HTTP_USER_AGENT,
            REMOTE_ADDR=REMOTE_ADDR,
        )

    def rest_update_meeting_project(self, auth_token, meeting_pk, project_pks, HTTP_USER_AGENT, REMOTE_ADDR):
        """
        Wrapper for updating the project of a meeting
        :param auth_token:
        :param meeting_pk:
        :param project_pks: list
        :param HTTP_USER_AGENT:
        :param REMOTE_ADDR:
        :return: response
        """
        self.client.credentials(HTTP_AUTHORIZATION="Token " + auth_token)

        data = {"projects": project_pks}

        return self.client.patch(
            f"/api/meetings/{meeting_pk}/",
            json.dumps(data, default=custom_json_handler),
            content_type="application/json",
            HTTP_USER_AGENT=HTTP_USER_AGENT,
            REMOTE_ADDR=REMOTE_ADDR,
        )

    def create_meeting_orm(
        self,
        auth_token,
        project_pk,
        title,
        description,
        start_date,
        end_date,
        HTTP_USER_AGENT=HTTP_USER_AGENT,
        REMOTE_ADDR=REMOTE_ADDR,
        attending_users=None,
        attending_contacts=None,
        scheduled_notification_writable=None,
        **kwargs,
    ):
        """Wrapper for rest_create_Meeting which also returns a Task Object from Djangos ORM"""

        response = self.rest_create_meeting(
            auth_token,
            project_pk,
            title,
            description,
            start_date,
            end_date,
            HTTP_USER_AGENT,
            REMOTE_ADDR,
            attending_users,
            attending_contacts,
            scheduled_notification_writable,
            **kwargs,
        )
        if response.status_code == status.HTTP_201_CREATED:
            decoded = json.loads(response.content.decode())
            return Meeting.objects.get(pk=decoded["pk"]), response
        else:
            return None, response


class ResourceBookingMixin:
    """
    REST calls for resource bookings.
    """

    def rest_get_all_resourcebookings(self, auth_token, url_param_str=""):
        self.client.credentials(HTTP_AUTHORIZATION="Token " + auth_token)

        return self.client.get(
            f"/api/resourcebookings/all/{url_param_str}", HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_get_my_resourcebookings(self, auth_token, url_param_str=""):
        self.client.credentials(HTTP_AUTHORIZATION="Token " + auth_token)

        return self.client.get(
            f"/api/resourcebookings/my/{url_param_str}", HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_get_editor_resourcebookings(self, auth_token, url_param_str=""):
        self.client.credentials(HTTP_AUTHORIZATION="Token " + auth_token)

        return self.client.get(
            f"/api/resourcebookings/editor/{url_param_str}", HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )
