#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#

from eric.core.tests import HTTP_USER_AGENT, REMOTE_ADDR
from eric.projects.models import Project


class FavouritesMixin:
    """
    A mixin that provides wrapper functions for API Calls for favourites;
    - /api/favourites/
    """

    def rest_get_favourite(self, auth_token, favourite_id, HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR):
        self.client.credentials(HTTP_AUTHORIZATION="Token " + auth_token)

        response = self.client.get(
            f"/api/favourites/{favourite_id}/", HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )
        return response

    def rest_get_favourite_projects(self, auth_token, HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR):
        self.client.credentials(HTTP_AUTHORIZATION="Token " + auth_token)

        response = self.client.get(
            "/api/projects/?favourite=true", HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )
        return response

    def rest_get_projects_with_favourite_param(
        self, auth_token, favourite, HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
    ):
        self.client.credentials(HTTP_AUTHORIZATION="Token " + auth_token)

        response = self.client.get(
            f"/api/projects/?favourite={favourite}", HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )
        return response

    def rest_create_favourite(
        self, auth_token, object_id, content_type_pk, HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
    ):
        self.client.credentials(HTTP_AUTHORIZATION="Token " + auth_token)

        # Make a REST API call for creating a favourite
        response = self.client.post(
            "/api/favourites/",
            {"object_id": object_id, "content_type_pk": content_type_pk},
            HTTP_USER_AGENT=HTTP_USER_AGENT,
            REMOTE_ADDR=REMOTE_ADDR,
        )
        return response

    def rest_create_project_favourite(
        self, auth_token, project_id, HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
    ):
        content_type = Project.get_content_type()
        return self.rest_create_favourite(auth_token, project_id, content_type.pk, HTTP_USER_AGENT, REMOTE_ADDR)

    def rest_delete_favourite(
        self, auth_token, object_id, content_type, HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
    ):
        self.client.credentials(HTTP_AUTHORIZATION="Token " + auth_token)

        response = self.client.delete(
            "/api/favourites/remove/?object_id={object_id}&content_type_pk={content_type_pk}".format(
                object_id=object_id, content_type_pk=content_type.pk
            ),
            HTTP_USER_AGENT=HTTP_USER_AGENT,
            REMOTE_ADDR=REMOTE_ADDR,
        )
        return response
