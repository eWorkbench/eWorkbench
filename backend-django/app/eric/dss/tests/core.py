#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import json

from rest_framework import status

from eric.core.tests import custom_json_handler
from eric.dss.models import DSSContainer, DSSEnvelope


class DSSContainerMixin:
    """
    Mixin which provides several wrapper methods for the /api/dsscontainers/ endpoint
    """

    def rest_get_dsscontainer(self, auth_token, dsscontainer_pk, HTTP_USER_AGENT, REMOTE_ADDR):
        """
        Wrapper for getting a dsscontainer by its pk via REST API
        """
        self.client.credentials(HTTP_AUTHORIZATION="Token " + auth_token)

        return self.client.get(
            f"/api/dsscontainers/{dsscontainer_pk}/", HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_get_dsscontainers(self, auth_token, HTTP_USER_AGENT, REMOTE_ADDR):
        """
        Wrapper for getting a list of dsscontainers that the current user has access to via REST API
        """
        self.client.credentials(HTTP_AUTHORIZATION="Token " + auth_token)

        return self.client.get("/api/dsscontainers/", {}, HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR)

    def rest_delete_dsscontainer(self, auth_token, dsscontainer_pk, HTTP_USER_AGENT, REMOTE_ADDR):
        """Wrapper for deleting a dsscontainer via REST API"""
        self.client.credentials(HTTP_AUTHORIZATION="Token " + auth_token)

        return self.client.delete(
            f"/api/dsscontainers/{dsscontainer_pk}/",
            HTTP_USER_AGENT=HTTP_USER_AGENT,
            REMOTE_ADDR=REMOTE_ADDR,
        )

    def rest_update_dsscontainer(
        self,
        auth_token,
        dsscontainer_pk,
        project_pks,
        name,
        path,
        read_write_setting,
        import_option,
        HTTP_USER_AGENT,
        REMOTE_ADDR,
    ):
        """Wrapper for updating a dsscontainer via REST API"""
        self.client.credentials(HTTP_AUTHORIZATION="Token " + auth_token)

        data = {
            "name": name,
            "path": path,
            "read_write_setting": read_write_setting,
            "import_option": import_option,
        }

        if project_pks:
            if isinstance(project_pks, list):
                data["projects"] = project_pks
            else:
                data["projects"] = [project_pks]

        return self.client.put(
            f"/api/dsscontainers/{dsscontainer_pk}/",
            json.dumps(data, default=custom_json_handler),
            content_type="application/json",
            HTTP_USER_AGENT=HTTP_USER_AGENT,
            REMOTE_ADDR=REMOTE_ADDR,
        )

    def rest_create_dsscontainer(
        self, auth_token, project_pks, name, path, read_write_setting, import_option, HTTP_USER_AGENT, REMOTE_ADDR
    ):
        """Wrapper for creating a file via REST API"""
        self.client.credentials(HTTP_AUTHORIZATION="Token " + auth_token)

        data = {
            "name": name,
            "path": path,
            "read_write_setting": read_write_setting,
            "import_option": import_option,
        }

        if project_pks:
            if isinstance(project_pks, list):
                data["projects"] = project_pks
            else:
                data["projects"] = [project_pks]

        return self.client.post(
            "/api/dsscontainers/",
            json.dumps(data, default=custom_json_handler),
            content_type="application/json",
            HTTP_USER_AGENT=HTTP_USER_AGENT,
            REMOTE_ADDR=REMOTE_ADDR,
        )

    def create_dsscontainer_orm(
        self, auth_token, project_pk, name, path, read_write_setting, import_option, HTTP_USER_AGENT, REMOTE_ADDR
    ):
        """Wrapper for rest_create_dsscontainer which also returns a DSSContainer Object from Djangos ORM"""

        response = self.rest_create_dsscontainer(
            auth_token, project_pk, name, path, read_write_setting, import_option, HTTP_USER_AGENT, REMOTE_ADDR
        )
        if response.status_code == status.HTTP_201_CREATED:
            decoded = json.loads(response.content.decode())
            return DSSContainer.objects.get(pk=decoded["pk"]), response
        else:
            return None, response


class DSSEnvelopeMixin:
    """
    Mixin which provides several wrapper methods for the /api/dssenvelopes/ endpoint
    """

    def rest_get_dssenvelope(self, auth_token, dssenvelope_pk, HTTP_USER_AGENT, REMOTE_ADDR):
        """
        Wrapper for getting a dssenvelope by its pk via REST API
        """
        self.client.credentials(HTTP_AUTHORIZATION="Token " + auth_token)

        return self.client.get(
            f"/api/dssenvelopes/{dssenvelope_pk}/", HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_get_dssenvelopes(self, auth_token, HTTP_USER_AGENT, REMOTE_ADDR):
        """
        Wrapper for getting a list of dssenvelopes that the current user has access to via REST API
        """
        self.client.credentials(HTTP_AUTHORIZATION="Token " + auth_token)

        return self.client.get("/api/dssenvelopes/", {}, HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR)

    def rest_delete_dssenvelope(self, auth_token, dssenvelope_pk, HTTP_USER_AGENT, REMOTE_ADDR):
        """Wrapper for deleting a dssenvelope via REST API"""
        self.client.credentials(HTTP_AUTHORIZATION="Token " + auth_token)

        return self.client.delete(
            f"/api/dssenvelopes/{dssenvelope_pk}/",
            HTTP_USER_AGENT=HTTP_USER_AGENT,
            REMOTE_ADDR=REMOTE_ADDR,
        )

    def rest_update_dssenvelope(
        self, auth_token, dssenvelope_pk, path, metadata_file_content, container, imported, HTTP_USER_AGENT, REMOTE_ADDR
    ):
        """Wrapper for updating a dssenvelope via REST API"""
        self.client.credentials(HTTP_AUTHORIZATION="Token " + auth_token)

        data = {
            "path": path,
            "metadata_file_content": metadata_file_content,
            "container": container,
            "imported": imported,
        }

        return self.client.put(
            f"/api/dssenvelopes/{dssenvelope_pk}/",
            json.dumps(data, default=custom_json_handler),
            content_type="application/json",
            HTTP_USER_AGENT=HTTP_USER_AGENT,
            REMOTE_ADDR=REMOTE_ADDR,
        )

    def rest_create_dssenvelope(
        self, auth_token, path, metadata_file_content, container, imported, HTTP_USER_AGENT, REMOTE_ADDR
    ):
        """Wrapper for creating a file via REST API"""
        self.client.credentials(HTTP_AUTHORIZATION="Token " + auth_token)

        data = {
            "path": path,
            "metadata_file_content": metadata_file_content,
            "container": container,
            "imported": imported,
        }

        return self.client.post(
            "/api/dssenvelopes/",
            json.dumps(data, default=custom_json_handler),
            content_type="application/json",
            HTTP_USER_AGENT=HTTP_USER_AGENT,
            REMOTE_ADDR=REMOTE_ADDR,
        )

    def create_dssenvelope_orm(
        self, auth_token, path, metadata_file_content, container, imported, HTTP_USER_AGENT, REMOTE_ADDR
    ):
        """Wrapper for rest_create_dssenvelope which also returns a DSSEnvelope Object from Djangos ORM"""

        response = self.rest_create_dssenvelope(
            auth_token, path, metadata_file_content, container, imported, HTTP_USER_AGENT, REMOTE_ADDR
        )
        if response.status_code == status.HTTP_201_CREATED:
            decoded = json.loads(response.content.decode())
            return DSSEnvelope.objects.get(pk=decoded["pk"]), response
        else:
            return None, response
