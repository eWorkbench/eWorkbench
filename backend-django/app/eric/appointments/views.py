#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import csv
import itertools
from datetime import timedelta

from django.http import HttpResponse, StreamingHttpResponse
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from rest_framework.views import APIView

from eric.appointments.config import CALENDAR_EXPORT_CACHE_SECONDS
from eric.appointments.utils import Echo
from eric.shared_elements.models import Meeting


@method_decorator(
    cache_page(CALENDAR_EXPORT_CACHE_SECONDS),
    'dispatch'
)
class CalendarCsvView(APIView):
    """
    Outputs anonymous CSV data of resource bookings within the next two weeks for simple calendars.
    """

    # make view public
    authentication_classes = ()
    permission_classes = ()

    def get(self, request, *args, **kwargs):
        response = self.build_standard_response()
        response['Content-Disposition'] = 'attachment; filename="calendar-export.csv"'
        return response

    @property
    def study_room_bookings(self):
        """
        Gets all bookings within the next two weeks.
        """

        start_of_today = timezone.now().date()
        in_two_weeks = start_of_today + timedelta(days=14)
        return Meeting.objects.study_room_bookings().intersecting_interval(start_of_today, in_two_weeks)

    @property
    def rows(self):
        """
        Iterator for all CSV rows (headers + content).
        """

        headers = [
            'appointment_id',
            'resource_name',
            'start',
            'end',
        ]
        appointments = (
            [
                appointment.pk,
                appointment.resource.name,
                appointment.date_time_start.isoformat(),
                appointment.date_time_end.isoformat(),
            ] for appointment in self.study_room_bookings
        )
        return itertools.chain(
            (headers,),
            appointments
        )

    def build_stream_response(self):
        """
        Returns the CSV data as streaming response.
        Might become necessary, if there is a huge amount of data.
        """

        pseudo_buffer = Echo()
        writer = csv.writer(pseudo_buffer, delimiter=';')
        streaming_content = (
            writer.writerow(row) for row in self.rows
        )
        response = StreamingHttpResponse(streaming_content, content_type="text/csv")
        return response

    def build_standard_response(self):
        """
        Returns the CSV data as standard HTTP response.
        """

        response = HttpResponse(content_type='text/csv')
        writer = csv.writer(response, delimiter=';')
        for row in self.rows:
            writer.writerow(row)

        return response
