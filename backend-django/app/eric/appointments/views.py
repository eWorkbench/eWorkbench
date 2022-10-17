#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import csv
import itertools
from abc import ABC, abstractmethod
from datetime import timedelta

from django.http import HttpResponse, StreamingHttpResponse
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page

from rest_framework.views import APIView

from eric.appointments.config import CALENDAR_EXPORT_CACHE_SECONDS, DISPLAY_EXPORT_CACHE_SECONDS
from eric.appointments.utils import Echo
from eric.shared_elements.models import Meeting, Resource
from eric.site_preferences.models import options as site_preferences


class PublicCSVExportView(APIView, ABC):
    authentication_classes = ()
    permission_classes = ()
    download_file_name = "export.csv"

    def get(self, request, *args, **kwargs):
        response = self.build_http_response()
        response["Content-Disposition"] = f'attachment; filename="{self.download_file_name}"'
        return response

    def build_http_response(self):
        """
        Returns the CSV data as standard HTTP response.
        """

        response = HttpResponse(content_type="text/csv")
        writer = csv.writer(response, delimiter=";")
        for row in self.headers_and_rows:
            writer.writerow(row)

        return response

    def build_stream_response(self):
        """
        Returns the CSV data as streaming response.
        Might become necessary, if there is a huge amount of data.
        """

        pseudo_buffer = Echo()
        writer = csv.writer(pseudo_buffer, delimiter=";")
        streaming_content = (writer.writerow(row) for row in self.headers_and_rows)
        response = StreamingHttpResponse(streaming_content, content_type="text/csv")
        return response

    @property
    def headers_and_rows(self):
        """Iterator for all CSV rows (headers + content)"""
        return itertools.chain((self.csv_headers,), self.csv_rows)

    @property
    @abstractmethod
    def csv_rows(self):
        """Returns an iterator for data rows"""
        pass

    @property
    @abstractmethod
    def csv_headers(self):
        """Returns the CSV headers as list"""
        pass


@method_decorator(cache_page(CALENDAR_EXPORT_CACHE_SECONDS), "dispatch")
class CalendarCsvView(PublicCSVExportView):
    """
    Outputs anonymous CSV data of study room bookings within the next two weeks for simple calendars.
    """

    download_file_name = "calendar-export.csv"

    @property
    def study_room_bookings(self):
        """
        Gets all bookings within the next two weeks.
        """

        start_of_today = timezone.now().date()
        in_two_weeks = start_of_today + timedelta(days=14)
        return (
            Meeting.objects.study_room_bookings()
            .filter(deleted=False)
            .intersecting_interval(start_of_today, in_two_weeks)
            .order_by("date_time_start")
        )

    @property
    def csv_headers(self):
        return [
            "appointment_id",
            "resource_name",
            "start",
            "end",
        ]

    @property
    def csv_rows(self):
        return (
            [
                appointment.pk,
                appointment.resource.name,
                appointment.date_time_start.isoformat(),
                appointment.date_time_end.isoformat(),
            ]
            for appointment in self.study_room_bookings
        )


@method_decorator(cache_page(DISPLAY_EXPORT_CACHE_SECONDS), "dispatch")
class DisplayCsvView(PublicCSVExportView):
    """
    Outputs anonymous CSV data of study room bookings from today for simple displays.
    """

    download_file_name = "display-export.csv"

    @property
    def study_room_bookings(self):
        """
        Returns upcoming bookings of today.
        """

        now = timezone.now()
        end_of_today = now.replace(hour=23, minute=59, second=59, microsecond=999_999)
        return (
            Meeting.objects.study_room_bookings()
            .filter(deleted=False)
            .intersecting_interval(now, end_of_today)
            .order_by("date_time_start")
        )

    @property
    def bookings_per_room(self):
        number = site_preferences.bookings_per_room_in_study_room_booking_display_export
        assert number > 0, "Export is configured to have no columns"
        return number

    @property
    def csv_headers(self):
        headers = [
            "RaumId",
            "Raumbezeichnung",
        ]

        # append the per-appointment headers with a two-digit index (e.g. "TerminStart01")
        for index in range(1, self.bookings_per_room + 1):
            for key in ["TerminStart", "TerminEnde", "Laufend", "TerminBezeichnung", "Organisator", "TerminDatum"]:
                headers.append(f"{key}{index:02d}")

        headers.extend(
            [
                "Datum",
                "Template",
            ]
        )

        return headers

    def format_date(self, date):
        return timezone.localtime(date)

    @property
    def csv_rows(self):
        study_rooms = Resource.objects.study_rooms().order_by("study_room_info__room_id")
        return (self.row_for_room(resource) for resource in study_rooms)

    def row_for_room(self, resource: Resource):
        study_room = resource.study_room_info
        now = timezone.now()

        cells = [study_room.room_id, study_room.name]

        # add available booking information
        bookings = self.study_room_bookings.filter(resource=resource)[: self.bookings_per_room]
        for booking in bookings:
            start_time = self.format_date(booking.date_time_start).strftime("%H:%M")
            end_time = self.format_date(booking.date_time_end).strftime("%H:%M")
            running_flag = booking.date_time_start <= now < booking.date_time_end
            appointment_name = booking.title
            organiser_name = booking.created_by.userprofile.first_name_and_last_name
            booking_date = self.format_date(booking.date_time_start).strftime("%d.%m.%Y")
            cells.extend([start_time, end_time, running_flag, appointment_name, organiser_name, booking_date])

        # add empty cells if there are not enough bookings to show
        empty_booking_count = self.bookings_per_room - len(bookings)
        empty_cells = [""] * 6 * empty_booking_count
        cells.extend(empty_cells)

        current_date = now.strftime("%d.%m.%Y")
        template = study_room.display_design.key
        cells.extend([current_date, template])

        return cells
