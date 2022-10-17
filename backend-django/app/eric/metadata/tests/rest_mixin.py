#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from rest_framework.status import HTTP_200_OK, HTTP_201_CREATED, HTTP_204_NO_CONTENT

from eric.metadata.tests import http_info


class MetadataRestRequestBuilder:
    client = None
    endpoint = None
    testcase = None

    def __init__(self, testcase):
        self.testcase = testcase
        self.client = testcase.client

    def as_user(self, token):
        self.client.credentials(HTTP_AUTHORIZATION="Token " + token)
        return self

    def for_endpoint(self, endpoint):
        self.endpoint = endpoint
        return self

    def get_list_url(self, model_pk):
        return "/api/{endpoint}/{model_pk}/metadata/".format(
            endpoint=self.endpoint,
            model_pk=model_pk,
        )

    def get_detail_url(self, model_pk, metadata_pk):
        return "/api/{endpoint}/{model_pk}/metadata/{version_pk}/".format(
            endpoint=self.endpoint, model_pk=model_pk, version_pk=metadata_pk
        )

    def check_status(self, response, assert_status):
        if assert_status is not None:
            self.testcase.assertEquals(response.status_code, assert_status, response.content.decode())

    def get_list(self, model_pk, assert_status=HTTP_200_OK):
        response = self.client.get(path=self.get_list_url(model_pk), **http_info)
        self.check_status(response, assert_status)
        return response

    def get(self, model_pk, version_pk, assert_status=HTTP_200_OK):
        response = self.client.get(path=self.get_detail_url(model_pk, version_pk), **http_info)
        self.check_status(response, assert_status)
        return response

    def post(self, model_pk, data, assert_status=HTTP_201_CREATED):
        response = self.client.post(path=self.get_list_url(model_pk), data=data, format="json", **http_info)
        self.check_status(response, assert_status)
        return response

    def put(self, model_pk, metadata_pk, data, assert_status=HTTP_200_OK):
        response = self.client.put(
            path=self.get_detail_url(model_pk, metadata_pk), data=data, format="json", **http_info
        )
        self.check_status(response, assert_status)
        return response

    def patch(self, model_pk, metadata_pk, data, assert_status=HTTP_200_OK):
        response = self.client.put(
            path=self.get_detail_url(model_pk, metadata_pk), data=data, format="json", **http_info
        )
        self.check_status(response, assert_status)
        return response

    def delete(self, model_pk, metadata_pk, assert_status=HTTP_204_NO_CONTENT):
        response = self.client.delete(path=self.get_detail_url(model_pk, metadata_pk), **http_info)
        self.check_status(response, assert_status)
        return response


class MetadataFieldRestRequestBuilder:
    client = None
    endpoint = None
    testcase = None

    def __init__(self, testcase):
        self.testcase = testcase
        self.client = testcase.client

    def as_user(self, token):
        self.client.credentials(HTTP_AUTHORIZATION="Token " + token)
        return self

    def for_endpoint(self, endpoint):
        self.endpoint = endpoint
        return self

    def get_list_url(self):
        return "/api/metadatafields/"

    def get_detail_url(self, pk):
        return f"/api/metadatafields/{pk}/"

    def check_status(self, response, assert_status):
        if assert_status is not None:
            self.testcase.assertEquals(response.status_code, assert_status, response.content.decode())

    def get_list(self, assert_status=HTTP_200_OK):
        response = self.client.get(path=self.get_list_url(), **http_info)
        self.check_status(response, assert_status)
        return response

    def get(self, pk, assert_status=HTTP_200_OK):
        response = self.client.get(path=self.get_detail_url(pk), **http_info)
        self.check_status(response, assert_status)
        return response

    def post(self, data, assert_status=HTTP_201_CREATED):
        response = self.client.post(path=self.get_list_url(), data=data, format="json", **http_info)
        self.check_status(response, assert_status)
        return response

    def put(self, pk, data, assert_status=HTTP_200_OK):
        response = self.client.put(path=self.get_detail_url(pk), data=data, format="json", **http_info)
        self.check_status(response, assert_status)
        return response

    def patch(self, pk, data, assert_status=HTTP_200_OK):
        response = self.client.put(path=self.get_detail_url(pk), data=data, format="json", **http_info)
        self.check_status(response, assert_status)
        return response

    def delete(self, pk, assert_status=HTTP_200_OK):
        response = self.client.delete(path=self.get_detail_url(pk), **http_info)
        self.check_status(response, assert_status)
        return response
