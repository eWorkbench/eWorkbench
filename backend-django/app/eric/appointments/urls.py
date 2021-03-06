#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.conf.urls import url

from eric.appointments.views import CalendarCsvView

urlpatterns = [
    url(r'study-room-booking-export/calendar/', CalendarCsvView.as_view(), name='study-room-booking-export-calendar')
]
