#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import json

from rest_framework import status

from eric.relations.models import Relation


class RelationsMixin:
    """
    A mixin that provides wrapper functions for API Calls for relations of tasks, notes, contacts, meetings, and files;
    - /api/tasks/{task_id}/relations
    - /api/notes/{note_id}/relations
    - etc...
    """

    def rest_get_project_relation(self, auth_token, project_id, relation_id, HTTP_USER_AGENT, REMOTE_ADDR):
        """Get relation of project by id via REST API"""

        self.client.credentials(HTTP_AUTHORIZATION="Token " + auth_token)

        response = self.client.get(
            "/api/projects/{project_id}/relations/{relation_id}/".format(
                project_id=project_id, relation_id=relation_id
            ),
            HTTP_USER_AGENT=HTTP_USER_AGENT,
            REMOTE_ADDR=REMOTE_ADDR,
        )
        return response

    def rest_get_task_relation(self, auth_token, task_id, relation_id, HTTP_USER_AGENT, REMOTE_ADDR):
        """Get relation of task by id via REST API"""

        self.client.credentials(HTTP_AUTHORIZATION="Token " + auth_token)

        response = self.client.get(
            f"/api/tasks/{task_id}/relations/{relation_id}/",
            HTTP_USER_AGENT=HTTP_USER_AGENT,
            REMOTE_ADDR=REMOTE_ADDR,
        )
        return response

    def rest_get_note_relation(self, auth_token, note_id, relation_id, HTTP_USER_AGENT, REMOTE_ADDR):
        """Get relations of note by id via REST API"""

        self.client.credentials(HTTP_AUTHORIZATION="Token " + auth_token)

        response = self.client.get(
            f"/api/notes/{note_id}/relations/{relation_id}/",
            HTTP_USER_AGENT=HTTP_USER_AGENT,
            REMOTE_ADDR=REMOTE_ADDR,
        )
        return response

    def rest_get_contact_relation(self, auth_token, contact_id, relation_id, HTTP_USER_AGENT, REMOTE_ADDR):
        """Get relation of contact by id via REST API"""

        self.client.credentials(HTTP_AUTHORIZATION="Token " + auth_token)

        response = self.client.get(
            "/api/contacts/{contact_id}/relations/{relation_id}/".format(
                contact_id=contact_id, relation_id=relation_id
            ),
            HTTP_USER_AGENT=HTTP_USER_AGENT,
            REMOTE_ADDR=REMOTE_ADDR,
        )
        return response

    def rest_get_meeting_relation(self, auth_token, meeting_id, relation_id, HTTP_USER_AGENT, REMOTE_ADDR):
        """Get relation of meeting by id via REST API"""

        self.client.credentials(HTTP_AUTHORIZATION="Token " + auth_token)

        response = self.client.get(
            "/api/meetings/{meeting_id}/relations/{relation_id}/".format(
                meeting_id=meeting_id, relation_id=relation_id
            ),
            HTTP_USER_AGENT=HTTP_USER_AGENT,
            REMOTE_ADDR=REMOTE_ADDR,
        )
        return response

    def rest_get_file_relation(self, auth_token, file_id, relation_id, HTTP_USER_AGENT, REMOTE_ADDR):
        """Get relation of file by id via REST API"""

        self.client.credentials(HTTP_AUTHORIZATION="Token " + auth_token)

        response = self.client.get(
            f"/api/files/{file_id}/relations/{relation_id}/",
            HTTP_USER_AGENT=HTTP_USER_AGENT,
            REMOTE_ADDR=REMOTE_ADDR,
        )
        return response

    def rest_get_project_relations(self, auth_token, project_id, HTTP_USER_AGENT, REMOTE_ADDR):
        """Get all relations of a task by id via REST API"""

        self.client.credentials(HTTP_AUTHORIZATION="Token " + auth_token)

        response = self.client.get(
            f"/api/projects/{project_id}/relations/",
            HTTP_USER_AGENT=HTTP_USER_AGENT,
            REMOTE_ADDR=REMOTE_ADDR,
        )
        return response

    def rest_get_task_relations(self, auth_token, task_id, HTTP_USER_AGENT, REMOTE_ADDR):
        """Get all relations of a task by id via REST API"""

        self.client.credentials(HTTP_AUTHORIZATION="Token " + auth_token)

        response = self.client.get(
            f"/api/tasks/{task_id}/relations/",
            HTTP_USER_AGENT=HTTP_USER_AGENT,
            REMOTE_ADDR=REMOTE_ADDR,
        )
        return response

    def rest_get_note_relations(self, auth_token, note_id, HTTP_USER_AGENT, REMOTE_ADDR):
        """Get all relations of a note by id via REST API"""

        self.client.credentials(HTTP_AUTHORIZATION="Token " + auth_token)

        response = self.client.get(
            f"/api/notes/{note_id}/relations/",
            HTTP_USER_AGENT=HTTP_USER_AGENT,
            REMOTE_ADDR=REMOTE_ADDR,
        )
        return response

    def rest_get_contact_relations(self, auth_token, contact_id, HTTP_USER_AGENT, REMOTE_ADDR):
        """Get all relations of a contact by id via REST API"""

        self.client.credentials(HTTP_AUTHORIZATION="Token " + auth_token)

        response = self.client.get(
            f"/api/contacts/{contact_id}/relations/",
            HTTP_USER_AGENT=HTTP_USER_AGENT,
            REMOTE_ADDR=REMOTE_ADDR,
        )
        return response

    def rest_get_meeting_relations(self, auth_token, meeting_id, HTTP_USER_AGENT, REMOTE_ADDR):
        """Get all relations of a meeting by id via REST API"""

        self.client.credentials(HTTP_AUTHORIZATION="Token " + auth_token)

        response = self.client.get(
            f"/api/meetings/{meeting_id}/relations/",
            HTTP_USER_AGENT=HTTP_USER_AGENT,
            REMOTE_ADDR=REMOTE_ADDR,
        )
        return response

    def rest_get_file_relations(self, auth_token, file_id, HTTP_USER_AGENT, REMOTE_ADDR):
        """Get all relations of a file by id via REST API"""

        self.client.credentials(HTTP_AUTHORIZATION="Token " + auth_token)

        response = self.client.get(
            f"/api/files/{file_id}/relations/",
            HTTP_USER_AGENT=HTTP_USER_AGENT,
            REMOTE_ADDR=REMOTE_ADDR,
        )
        return response

    def rest_get_dmp_relations(self, auth_token, dmp_id, HTTP_USER_AGENT, REMOTE_ADDR):
        """Get all relations of a dmp by id via REST API"""

        self.client.credentials(HTTP_AUTHORIZATION="Token " + auth_token)

        response = self.client.get(
            f"/api/dmps/{dmp_id}/relations/",
            HTTP_USER_AGENT=HTTP_USER_AGENT,
            REMOTE_ADDR=REMOTE_ADDR,
        )
        return response

    def rest_create_relation(
        self,
        auth_token,
        object_type,
        object_id,
        left_content_type,
        left_object_id,
        right_content_type,
        right_object_id,
        private_field,
        HTTP_USER_AGENT,
        REMOTE_ADDR,
    ):
        """
        Wrapper for creating a new relation via REST API
        :param auth_token: authorization token for REST API
        :param object_type: name of the object for the api endpoint, where the relation should be created (e.g., tasks, notes, ...)
        :param object_id: the id of the object for which the relation should be created (e.g., task.id)
        :param left_content_type:
        :param left_object_id:
        :param right_content_type:
        :param right_object_id:
        :param private_field: whether or not this relation should be kept private
        :param HTTP_USER_AGENT:
        :param REMOTE_ADDR:
        :return:
        """

        self.client.credentials(HTTP_AUTHORIZATION="Token " + auth_token)

        # Make a REST API call for creating a relation
        response = self.client.post(
            f"/api/{object_type}/{object_id}/relations/",
            {
                "left_content_type": left_content_type.id,
                "left_object_id": left_object_id,
                "right_content_type": right_content_type.id,
                "right_object_id": right_object_id,
                "private": private_field,
            },
            HTTP_USER_AGENT=HTTP_USER_AGENT,
            REMOTE_ADDR=REMOTE_ADDR,
        )

        return response

    def create_generic_relation(
        self,
        auth_token,
        object_type,
        object_id,
        left_content_type,
        left_object_id,
        right_content_type,
        right_object_id,
        private_field,
        HTTP_USER_AGENT,
        REMOTE_ADDR,
    ):
        """
        Tries to create a generic relation for object "object_type" and object_id
        :param auth_token:
        :param object_type:
        :param object_id:
        :param left_content_type:
        :param left_object_id:
        :param right_content_type:
        :param right_object_id:
        :param private_field:
        :param HTTP_USER_AGENT:
        :param REMOTE_ADDR:
        :return: relation
        """
        self.client.credentials(HTTP_AUTHORIZATION="Token " + auth_token)

        # store the relation length
        initial_relation_length = Relation.objects.all().count()

        # create relation via REST API
        response = self.rest_create_relation(
            auth_token,
            object_type,
            object_id,
            left_content_type,
            left_object_id,
            right_content_type,
            right_object_id,
            private_field,
            HTTP_USER_AGENT,
            REMOTE_ADDR,
        )

        # relation should have been created, HTTP response code should be 201
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # decode response and load it into json
        content = response.content.decode()
        decoded_response = json.loads(content)

        self.assertTrue('"pk":' in content, msg="primary key (pk) in response")
        self.assertTrue(
            '"left_content_type":' + str(left_content_type.id) in content, msg="correct left_content_type in response"
        )
        self.assertTrue('"left_object_id":' in content, msg="correct left_object_id in response")
        self.assertTrue(
            '"right_content_type":' + str(right_content_type.id) in content,
            msg="correct right_content_type in response",
        )
        self.assertTrue('"right_object_id":' in content, msg="correct right_object_id in response")
        self.assertTrue('"private":' in content, msg="primary key (pk) in response")
        self.assertTrue('"created_at":' in content, msg="created_at in response")
        self.assertTrue('"created_by":' in content, msg="created_by in response")

        # see what the actual Relation element from database looks like
        pk = decoded_response["pk"]
        # get the relation object from database
        relation = Relation.objects.get(pk=pk)

        # check if the relation object was created
        self.assertEqual(
            Relation.objects.all().count(), initial_relation_length + 1, msg="check if the relation was created"
        )

        # verify several relation attributes with api response
        self.assertEqual(str(relation.pk), decoded_response["pk"])
        self.assertEqual(relation.private, decoded_response["private"])
        self.assertEqual(str(relation.left_object_id), decoded_response["left_object_id"])
        self.assertEqual(str(relation.right_object_id), decoded_response["right_object_id"])

        # check if the correct left_content_type, left_object_id, right_content_type, right_object_id were saved
        self.assertEqual(
            relation.left_content_type, left_content_type, msg="check if correct left_content_type was saved"
        )
        self.assertEqual(relation.left_object_id, left_object_id, msg="check if correct left_object_id was saved")
        self.assertEqual(
            relation.right_content_type, right_content_type, msg="check if correct right_content_type was saved"
        )
        self.assertEqual(relation.right_object_id, right_object_id, msg="check if correct right_object_id was saved")
        self.assertEqual(relation.private, private_field, msg="check if correct private_field was saved")

        return relation

    def create_project_relation(
        self,
        auth_token,
        project_id,
        left_content_type,
        left_object_id,
        right_content_type,
        right_object_id,
        private_field,
        HTTP_USER_AGENT,
        REMOTE_ADDR,
    ):
        """
        tries to create a new relation for a project
        """
        return self.create_generic_relation(
            auth_token,
            "projects",
            project_id,
            left_content_type,
            left_object_id,
            right_content_type,
            right_object_id,
            private_field,
            HTTP_USER_AGENT,
            REMOTE_ADDR,
        )

    def create_file_relation(
        self,
        auth_token,
        file_id,
        left_content_type,
        left_object_id,
        right_content_type,
        right_object_id,
        private_field,
        HTTP_USER_AGENT,
        REMOTE_ADDR,
    ):
        """
        tries to create a new relation for a file
        """
        return self.create_generic_relation(
            auth_token,
            "files",
            file_id,
            left_content_type,
            left_object_id,
            right_content_type,
            right_object_id,
            private_field,
            HTTP_USER_AGENT,
            REMOTE_ADDR,
        )

    def create_note_relation(
        self,
        auth_token,
        note_id,
        left_content_type,
        left_object_id,
        right_content_type,
        right_object_id,
        private_field,
        HTTP_USER_AGENT,
        REMOTE_ADDR,
    ):
        """
        tries to create a new relation for a note
        """
        return self.create_generic_relation(
            auth_token,
            "notes",
            note_id,
            left_content_type,
            left_object_id,
            right_content_type,
            right_object_id,
            private_field,
            HTTP_USER_AGENT,
            REMOTE_ADDR,
        )

    def create_task_relation(
        self,
        auth_token,
        task_id,
        left_content_type,
        left_object_id,
        right_content_type,
        right_object_id,
        private_field,
        HTTP_USER_AGENT,
        REMOTE_ADDR,
    ):
        """
        tries to create a new relation for a task
        """
        return self.create_generic_relation(
            auth_token,
            "tasks",
            task_id,
            left_content_type,
            left_object_id,
            right_content_type,
            right_object_id,
            private_field,
            HTTP_USER_AGENT,
            REMOTE_ADDR,
        )

    def create_meeting_relation(
        self,
        auth_token,
        meeting_id,
        left_content_type,
        left_object_id,
        right_content_type,
        right_object_id,
        private_field,
        HTTP_USER_AGENT,
        REMOTE_ADDR,
    ):
        """
        tries to create a new relation for a task
        """
        return self.create_generic_relation(
            auth_token,
            "meetings",
            meeting_id,
            left_content_type,
            left_object_id,
            right_content_type,
            right_object_id,
            private_field,
            HTTP_USER_AGENT,
            REMOTE_ADDR,
        )

    def create_contact_relation(
        self,
        auth_token,
        contact_id,
        left_content_type,
        left_object_id,
        right_content_type,
        right_object_id,
        private_field,
        HTTP_USER_AGENT,
        REMOTE_ADDR,
    ):
        """
        tries to create a new relation for a task
        """
        return self.create_generic_relation(
            auth_token,
            "contacts",
            contact_id,
            left_content_type,
            left_object_id,
            right_content_type,
            right_object_id,
            private_field,
            HTTP_USER_AGENT,
            REMOTE_ADDR,
        )

    def rest_update_task_relation(
        self,
        auth_token,
        task_id,
        relation_id,
        left_content_type,
        left_object_id,
        right_content_type,
        right_object_id,
        private_field,
        HTTP_USER_AGENT,
        REMOTE_ADDR,
    ):
        """tries to update the relation"""

        self.client.credentials(HTTP_AUTHORIZATION="Token " + auth_token)

        response = self.client.put(
            f"/api/tasks/{task_id}/relations/{relation_id}/",
            {
                "left_content_type": left_content_type.id,
                "left_object_id": left_object_id,
                "right_content_type": right_content_type.id,
                "right_object_id": right_object_id,
                "private": private_field,
            },
            HTTP_USER_AGENT=HTTP_USER_AGENT,
            REMOTE_ADDR=REMOTE_ADDR,
        )
        return response

    def rest_delete_task_relation(self, auth_token, task_id, relation_id, HTTP_USER_AGENT, REMOTE_ADDR):
        """tries to delete a relation"""

        self.client.credentials(HTTP_AUTHORIZATION="Token " + auth_token)

        response = self.client.delete(
            f"/api/tasks/{task_id}/relations/{relation_id}/",
            HTTP_USER_AGENT=HTTP_USER_AGENT,
            REMOTE_ADDR=REMOTE_ADDR,
        )
        return response
