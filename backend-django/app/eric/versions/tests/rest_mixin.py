#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from rest_framework.status import HTTP_200_OK, HTTP_201_CREATED

from eric.core.utils import remove_none_values_from_dict
from eric.versions.tests import HTTP_USER_AGENT, REMOTE_ADDRESS


class HttpInfo:
    def __init__(self, auth_token=None, user_agent=HTTP_USER_AGENT, remote_address=REMOTE_ADDRESS):
        self.auth_token = auth_token
        self.user_agent = user_agent
        self.remote_address = remote_address


class VersionRestRequestBuilder:
    user_agent = None
    remote_address = None
    client = None
    endpoint = None
    as_sender = [HTTP_USER_AGENT, REMOTE_ADDRESS]
    asserter = None

    def __init__(self, client, asserter):
        self.client = client
        self.asserter = asserter

    def as_user(self, token):
        self.client.credentials(HTTP_AUTHORIZATION="Token " + token)
        return self

    def for_endpoint(self, endpoint):
        self.endpoint = endpoint
        return self

    def get_list_url(self, model_pk):
        return "/api/{endpoint}/{model_pk}/versions/?limit=0".format(
            endpoint=self.endpoint,
            model_pk=model_pk,
        )

    def get_detail_url(self, model_pk, version_pk):
        return "/api/{endpoint}/{model_pk}/versions/{version_pk}/".format(
            endpoint=self.endpoint, model_pk=model_pk, version_pk=version_pk
        )

    def check_status(self, response, assert_status):
        if assert_status is not None:
            self.asserter.assertEquals(response.status_code, assert_status, response.content.decode())

    def get_list(self, model_pk, assert_status=HTTP_200_OK):
        response = self.client.get(self.get_list_url(model_pk), *self.as_sender)
        self.check_status(response, assert_status)
        return response

    def get(self, model_pk, version_pk, assert_status=HTTP_200_OK):
        response = self.client.get(self.get_detail_url(model_pk, version_pk), *self.as_sender)
        self.check_status(response, assert_status)
        return response

    def restore(self, model_pk, version_pk, assert_status=HTTP_200_OK):
        response = self.client.post(f"{self.get_detail_url(model_pk, version_pk)}/restore/", *self.as_sender)
        self.check_status(response, assert_status)
        return response

    def preview(self, model_pk, version_pk, assert_status=HTTP_200_OK):
        response = self.client.get(f"{self.get_detail_url(model_pk, version_pk)}/preview/", *self.as_sender)
        self.check_status(response, assert_status)
        return response

    def post_action(self, model_pk, version_pk, action, assert_status=HTTP_201_CREATED):
        response = self.client.post(f"{self.get_detail_url(model_pk, version_pk)}/{action}/", *self.as_sender)
        self.check_status(response, assert_status)
        return response

    def post(self, model_pk, data, assert_status=HTTP_201_CREATED):
        response = self.client.post(self.get_list_url(model_pk), data, *self.as_sender)
        self.check_status(response, assert_status)
        return response

    def put(self, model_pk, version_pk, data, assert_status=HTTP_200_OK):
        response = self.client.put(self.get_detail_url(model_pk, version_pk), data, *self.as_sender)
        self.check_status(response, assert_status)
        return response

    def delete(self, model_pk, version_pk, assert_status=HTTP_200_OK):
        response = self.client.delete(self.get_detail_url(model_pk, version_pk), *self.as_sender)
        self.check_status(response, assert_status)
        return response


class VersionRestMixin:
    """
    A mixin that provides wrapper functions for API calls for extensions of tasks, notes, contacts, meetings, ...
    - /api/tasks/{task_id}/{extension}
    - /api/tasks/{task_id}/{extension}/{extension_id}/
    - /api/notes/{note_id}/{extension}
    - etc...
    """

    extension_name = "versions"

    def get_version_list_url(self, endpoint, endpoint_id):
        """Returns the URL for an endpoints extension, e.g. /api/tasks/{task_id}/versions/"""
        return "/api/{endpoint}/{endpoint_id}/{extension}/?limit=0".format(
            endpoint=endpoint, endpoint_id=endpoint_id, extension=self.extension_name
        )

    def get_version_url(self, endpoint, endpoint_id, extension_id):
        """Returns the URL for an endpoints specific extension, e.g. /api/tasks/{task_id}/versions/{version_id}/"""
        return "/api/{endpoint}/{endpoint_id}/{extension}/{extension_id}/".format(
            endpoint=endpoint, endpoint_id=endpoint_id, extension=self.extension_name, extension_id=extension_id
        )

    def set_credentials(self, http_info):
        self.client.credentials(HTTP_AUTHORIZATION="Token " + http_info.auth_token)

    def rest_get_version_list(self, endpoint, endpoint_id, http_info):
        """Performs a GET request to an endpoints extension, e.g. /api/tasks/{task_id}/versions/"""
        self.set_credentials(http_info)
        return self.client.get(
            path=self.get_version_list_url(endpoint, endpoint_id),
            HTTP_USER_AGENT=http_info.user_agent,
            REMOTE_ADDR=http_info.remote_address,
        )

    def rest_get_version(self, endpoint, endpoint_id, extension_id, http_info):
        """Performs a GET request to a endpoints specific extension, e.g. /api/tasks/{task_id}/versions/{version_id}/"""
        self.set_credentials(http_info)
        return self.client.get(
            path=self.get_version_url(endpoint, endpoint_id, extension_id),
            HTTP_USER_AGENT=http_info.user_agent,
            REMOTE_ADDR=http_info.remote_address,
        )

    def rest_post_version_action(self, endpoint, endpoint_id, extension_id, action, http_info):
        """Performs a POST request to an endpoints extensions additional endpoint,
        e.g. /api/tasks/{task_id}/versions/{version_id}/restore"""
        self.set_credentials(http_info)
        return self.client.post(
            path=f"{self.get_version_url(endpoint, endpoint_id, extension_id)}{action}/",
            HTTP_USER_AGENT=http_info.user_agent,
            REMOTE_ADDR=http_info.remote_address,
        )

    def rest_restore_version(self, endpoint, endpoint_id, extension_id, http_info):
        self.set_credentials(http_info)
        return self.client.post(
            path="{}{}/".format(self.get_version_url(endpoint, endpoint_id, extension_id), "restore"),
            HTTP_USER_AGENT=http_info.user_agent,
            REMOTE_ADDR=http_info.remote_address,
        )

    def rest_preview_version(self, endpoint, endpoint_id, extension_id, http_info):
        self.set_credentials(http_info)
        return self.client.get(
            path="{}{}/".format(self.get_version_url(endpoint, endpoint_id, extension_id), "preview"),
            HTTP_USER_AGENT=http_info.user_agent,
            REMOTE_ADDR=http_info.remote_address,
        )

    def rest_post_version(self, endpoint, endpoint_id, data, http_info):
        """Performs a POST request to an endpoint extension, e.g. /api/tasks/{task_id}/versions/"""
        self.set_credentials(http_info)
        return self.client.post(
            path=self.get_version_list_url(endpoint, endpoint_id),
            data=remove_none_values_from_dict(data),
            HTTP_USER_AGENT=http_info.user_agent,
            REMOTE_ADDR=http_info.remote_address,
        )

    def rest_put_version(self, endpoint, endpoint_id, extension_id, data, http_info):
        """Performs a PUT request to a specific endpoint extension,
        e.g. /api/tasks/{task_id}/versions/{version_id}/"""
        self.set_credentials(http_info)
        response = self.client.put(
            path=self.get_version_url(endpoint, endpoint_id, extension_id),
            data=remove_none_values_from_dict(data),
            HTTP_USER_AGENT=http_info.user_agent,
            REMOTE_ADDR=http_info.remote_address,
        )
        return response

    def rest_delete_version(self, endpoint, endpoint_id, extension_id, http_info):
        """Performs a DELETE request to a specific endpoint extension,
        e.g. /api/tasks/{task_id}/versions/{version_id}/"""
        self.set_credentials(http_info)
        response = self.client.delete(
            path=self.get_version_url(endpoint, endpoint_id, extension_id),
            HTTP_USER_AGENT=http_info.user_agent,
            REMOTE_ADDR=http_info.remote_address,
        )
        return response
