#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#

from eric.core.tests import HTTP_USER_AGENT, REMOTE_ADDR


class ResourceBookingCalendarExportMixin:
    def rest_get_resource_booking_calendar_export(self, http_user_agent=HTTP_USER_AGENT, remote_addr=REMOTE_ADDR):
        """
        Resets the client credentials and GETs the calendar export as anonymous user.
        """
        self.client.credentials()

        return self.client.get(
            '/api/study-room-booking-export/calendar/',
            HTTP_USER_AGENT=http_user_agent, REMOTE_ADDR=remote_addr
        )
