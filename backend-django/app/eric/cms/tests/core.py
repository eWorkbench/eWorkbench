#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import json

from eric.core.tests import custom_json_handler


class LaunchScreenMixin:
    def rest_get_launch_screen(self, auth_token, launch_screen_pk, HTTP_USER_AGENT, REMOTE_ADDR):
        self.client.credentials(HTTP_AUTHORIZATION="Token " + auth_token)

        return self.client.get(
            f"/api/launchscreens/{launch_screen_pk}/", HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR
        )

    def rest_get_launch_screens(self, auth_token, HTTP_USER_AGENT, REMOTE_ADDR):
        self.client.credentials(HTTP_AUTHORIZATION="Token " + auth_token)

        return self.client.get("/api/launchscreens/", HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR)


class AcceptedScreenMixin:
    def rest_create_accepted_screen(
        self, auth_token, launch_screen_pk, version, timestamp, HTTP_USER_AGENT, REMOTE_ADDR
    ):
        self.client.credentials(HTTP_AUTHORIZATION="Token " + auth_token)

        data = {
            "launch_screen": launch_screen_pk,
            "accepted_version": version,
            "accepted_timestamp": timestamp,
        }

        return self.client.post(
            "/api/acceptedscreens/",
            json.dumps(data, default=custom_json_handler),
            content_type="application/json",
            HTTP_USER_AGENT=HTTP_USER_AGENT,
            REMOTE_ADDR=REMOTE_ADDR,
        )
