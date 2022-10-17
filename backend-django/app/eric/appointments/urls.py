#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.urls import re_path

from eric.appointments.views import CalendarCsvView, DisplayCsvView

urlpatterns = [
    re_path(
        r"study-room-booking-export/calendar/", CalendarCsvView.as_view(), name="study-room-booking-export-calendar"
    ),
    re_path(r"study-room-booking-export/display/", DisplayCsvView.as_view(), name="study-room-booking-export-display"),
]
