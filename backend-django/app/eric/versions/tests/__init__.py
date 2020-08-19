#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import json
from datetime import datetime

from django.utils import timezone

HTTP_USER_AGENT = "APITestClient"
REMOTE_ADDRESS = "127.0.0.1"
USER_GROUP_NAME = "User"

http_info = {
    'HTTP_USER_AGENT': HTTP_USER_AGENT,
    'REMOTE_ADDR': REMOTE_ADDRESS,
}


class VersionData:
    def __init__(self, content_type=None, object_id=None, summary=None):
        self.content_type = content_type
        self.object_id = object_id
        self.summary = summary

    def as_dict(self):
        return {
            'content_type': self.content_type,
            'object_id': self.object_id,
            'summary': self.summary,
        }


def get_json_content(response):
    content_str = response.content.decode()
    return json.loads(content_str)


def get_utc_datetime(year, month, day):
    return datetime(year=year, month=month, day=day, hour=0, minute=0, second=0, tzinfo=timezone.utc)
