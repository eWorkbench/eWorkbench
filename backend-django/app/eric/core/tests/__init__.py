#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from uuid import UUID

HTTP_USER_AGENT = "APITestClient"
REMOTE_ADDR = "127.0.0.1"

HTTP_INFO = {
    "HTTP_USER_AGENT": HTTP_USER_AGENT,
    "REMOTE_ADDR": REMOTE_ADDR,
}


def custom_json_handler(obj):
    """
    Custom JSON Formatting handler
    Formats dumping UUID and date objects into json

    Usage:
     json.dumps(data, default=custom_json_handler)
    :param obj:
    :return:
    """
    if isinstance(obj, UUID):
        return str(obj)
    elif hasattr(obj, "isoformat"):
        return obj.isoformat()

    return obj
