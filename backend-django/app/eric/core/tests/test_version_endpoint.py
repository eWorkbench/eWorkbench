#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import json

from rest_framework import status
from rest_framework.test import APITestCase

HTTP_USER_AGENT = "APITestClient"
REMOTE_ADDR = "127.0.0.1"


class VersionAPITestCase(APITestCase):
    """Basic Testing whether the /api/version endpoint is working"""

    def test_get_version_api(self):
        response = self.client.get("/api/version", HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
