#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import jwt
import vobject
from django.conf import settings
from django.http import HttpResponse
from django.utils import timezone
from django_userforeignkey.request import get_current_user
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.serializers import ModelSerializer

from eric.core.rest.viewsets import BaseGenericViewSet
from eric.core.utils import convert_html_to_text
from eric.projects.models.models import ResourceBooking
from eric.projects.rest.filters import ResourceBookingFilter
from eric.projects.rest.serializers import MinimalisticResourceBookingSerializer
from eric.shared_elements.models import Task, Meeting
from eric.shared_elements.rest.filters import MeetingFilter, TaskFilter
from eric.shared_elements.rest.serializers import MinimalisticTaskSerializer, MinimalisticMeetingSerializer


class MyScheduleViewSet(BaseGenericViewSet, viewsets.mixins.ListModelMixin):
    """
    Viewset for My Schedule
    provides only the list endpoint with tasks and meetings of the current user
    """

    def get_serializer_class(self):
        return ModelSerializer

    def get_queryset(self):
        return Meeting.objects.none()

    def get_tasks_queryset(self):
        return Task.objects.viewable().prefetch_common().assigned().prefetch_related(
            'projects',
        ).filter(deleted=False, start_date__isnull=False, due_date__isnull=False)

    def get_meetings_queryset(self):
        return Meeting.objects.viewable().prefetch_common().attending().prefetch_related(
            'projects',
        ).filter(deleted=False)

    def get_my_resourcebookings_queryset(self):
        return ResourceBooking.objects.viewable().prefetch_related('resource', 'meeting')

    def get_filtered_schedule_elements(self):
        show_tasks = self.request.query_params.get('show_tasks', 1)

        show_meetings = self.request.query_params.get('show_meetings', 1)

        show_my_resourcebookings = self.request.query_params.get('show_my_resourcebookings', 1)

        tasks = Task.objects.none()
        my_resource_bookings = ResourceBooking.objects.none()
        meetings = Meeting.objects.none()

        if show_tasks == 1 or show_tasks == '1':
            # filter all viewable tasks, that are assigned to the current user, and that have a start and due date
            tasks = self.get_tasks_queryset()
            # overwrite filter class for tasks
            self.filter_class = TaskFilter
            tasks = self.filter_queryset(tasks)

        if show_my_resourcebookings == 1 or show_my_resourcebookings == '1':
            # filter all viewable resource_bookings, that were created by the current user
            my_resource_bookings = self.get_my_resourcebookings_queryset()
            # overwrite filter class for resource_bookings
            self.filter_class = ResourceBookingFilter
            my_resource_bookings = self.filter_queryset(my_resource_bookings)

        if show_meetings == 1 or show_meetings == '1':
            # filter all viewable meetings, that are attending to the current user
            meetings = self.get_meetings_queryset()
            # overwrite filter class for meetings
            self.filter_class = MeetingFilter
            meetings = self.filter_queryset(meetings)

        return tasks, my_resource_bookings, meetings

    def list(self, request, *args, **kwargs):
        tasks, my_resource_bookings, meetings = self.get_filtered_schedule_elements()

        serialized_tasks = MinimalisticTaskSerializer(
            tasks, many=True, context={'request': self.request}
        ).data

        serialized_my_resourcebookings = MinimalisticResourceBookingSerializer(
            my_resource_bookings, many=True, context={'request': self.request}
        ).data

        serialized_meetings = MinimalisticMeetingSerializer(
            meetings, many=True, context={'request': self.request}
        ).data

        return Response(serialized_tasks + serialized_my_resourcebookings + serialized_meetings)

    @action(detail=False, methods=['GET'], url_path="get_export_link", url_name="get_export_link")
    def get_ical_export_link(self, request, *args, **kwargs):
        """
        Generates a link with a JWT for the ical export endpoint
        This is necessary so browsers can access the exported content without sending authorization headers
        :param request:
        :param pk:
        :return:
        """
        # get the current request path/url and replace "get_export_token" with the target url (which is "export")
        path = request.get_full_path()
        path = path.replace('get_export_link', 'export')

        # build a relative URL for the given path
        # absolute_url = request.build_absolute_uri(path)

        absolute_url = path

        # the token should contain the following information
        payload = {
            # store the users primary key
            'user': request.user.pk,
            # store the verification token, so the token can be revoked afterwards
            'jwt_verification_token': request.user.userprofile.jwt_verification_token,
            # store the path that this token is valid for
            'path': path
        }

        # generate JWT with the payload and the secret key
        jwt_token = jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')

        if "?" in absolute_url:
            # append it via "&"
            absolute_url = "{absolute_url}&jwt={token}".format(
                absolute_url=absolute_url,
                token=jwt_token.decode("utf-8")
            )
        else:
            absolute_url = "{absolute_url}?jwt={token}".format(
                absolute_url=absolute_url,
                token=jwt_token.decode("utf-8")
            )

        # convert the absolute_url to a short_url
        from eric.short_url.models import ShortURL

        short_url = ShortURL.objects.create(
            url=absolute_url
        )

        # return the URL
        return Response({
            'url': short_url.get_short_url()
        })

    @action(detail=False, methods=['GET'], url_path="export")
    def ical_export(self, *args, **kwargs):
        """Endpoint for the iCal export"""
        tasks, resource_bookings, meetings = self.get_filtered_schedule_elements()

        calendar = vobject.iCalendar()
        calendar.add('method').value = 'PUBLISH'  # IE/Outlook needs this

        # iterate over all meetings
        for meeting in meetings:
            event = meeting.export_as_ical(calendar)

        # iterate over all tasks
        for task in tasks:
            event = calendar.add('vevent')

            # meta information: created, last modified, dtstamp (ical creation)
            event.add('created').value = task.created_at  # created_at modification timestamp
            event.add('last-modified').value = task.last_modified_at  # last modification timestamp
            event.add('dtstamp').value = timezone.now()  # when the ical information is being created (so basically now)

            # task info
            event.add('dtstart').value = task.start_date  # start date
            event.add('dtend').value = task.due_date  # end date
            event.add('summary').value = task.title  # title
            event.add('uid').value = str(task.pk)  # uid
            event.add('description').value = convert_html_to_text(
                task.description)  # description (without html)

            # creator of the task
            event.add('organizer').value = "CN:%(organizer_name)s:MAILTO:%(organizer_mail)s" % {
                'organizer_name': str(task.created_by),
                'organizer_mail': task.created_by.email
            }

            # add assigned users
            for user in task.assigned_users.all():
                event.add('attendee').value = "MAILTO: %(attendee)s" % {'attendee': user.email}

        # iterate over all resource_bookings
        for resource_booking in resource_bookings:
            event = calendar.add('vevent')

            # meta information: created, last modified, dtstamp (ical creation)
            event.add('created').value = resource_booking.created_at  # created_at modification timestamp
            event.add('last-modified').value = resource_booking.last_modified_at  # last modification timestamp
            event.add('dtstamp').value = timezone.now()  # when the ical information is being created (so basically now)

            # resource_booking info
            event.add('dtstart').value = resource_booking.date_time_start  # start date
            event.add('dtend').value = resource_booking.date_time_end  # end date
            event.add('summary').value = resource_booking.resource.name  # title
            event.add('uid').value = str(resource_booking.pk)  # uid

            # creator of the resource_booking
            event.add('organizer').value = "CN:%(organizer_name)s:MAILTO:%(organizer_mail)s" % {
                'organizer_name': str(resource_booking.created_by),
                'organizer_mail': resource_booking.created_by.email
            }

        cal_stream = calendar.serialize()

        response = HttpResponse(cal_stream)
        response['Content-Type'] = 'text/calendar'
        response['Filename'] = 'myschedule.ics'  # IE needs this
        response['Content-Disposition'] = 'inline; filename=myschedule.ics'

        return response
