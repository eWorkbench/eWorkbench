#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import vobject
from django.http import HttpResponse
from django.utils import timezone
from django_userforeignkey.request import get_current_user
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.serializers import Serializer

from eric.jwt_auth.jwt_utils import build_jwt_url
from eric.core.rest.viewsets import BaseGenericViewSet
from eric.core.utils import convert_html_to_text
from eric.shared_elements.models import Task, Meeting
from eric.shared_elements.rest.filters import MeetingFilter, TaskFilter
from eric.shared_elements.rest.serializers import MinimalisticTaskSerializer, MinimalisticMeetingSerializer


class MyScheduleViewSet(BaseGenericViewSet):
    """
    Viewset for My Schedule
    provides only the list endpoint with tasks and meetings of the current user
    """

    # we need some serializer definition for the openAPI generation
    serializer_class = Serializer

    def get_queryset(self):
        return Meeting.objects.none()

    def get_tasks_queryset(self):
        return Task.objects.viewable().prefetch_common().assigned().prefetch_related(
            'projects',
        ).filter(deleted=False, start_date__isnull=False, due_date__isnull=False)

    def get_meetings_queryset(self, show_meetings_for):
        qs = Meeting.objects.none()
        current_user = get_current_user()
        # overwrite filter class for meetings
        self.filterset_class = MeetingFilter
        if str(current_user.pk) in show_meetings_for:
            # this is the queryset for the current user, which uses viewable and attending
            qs = Meeting.objects.viewable().prefetch_common().attending().prefetch_related(
                'projects',
            ).filter(deleted=False, date_time_start__isnull=False, date_time_end__isnull=False)
            # we have to filter the queryset here before the union as filtering on unions isnt supported
            qs = self.filter_queryset(qs)
        # this is the queryset for users other than the current user, which uses viewable()
        qs_extended = Meeting.objects.viewable().prefetch_common().prefetch_related(
            'projects',
        ).exclude(
            attending_users=current_user
        ).filter(
            attending_users__in=show_meetings_for,
            deleted=False,
            date_time_start__isnull=False,
            date_time_end__isnull=False
        )
        # we have to filter the queryset here before the union as filtering on unions isnt supported
        qs_extended = self.filter_queryset(qs_extended)
        # now we can build the union
        qs = qs.union(qs_extended)
        return qs

    def get_filtered_schedule_elements(self):
        show_tasks = self.request.query_params.get('show_tasks', 1)
        show_meetings = self.request.query_params.get('show_meetings', 1)

        show_meetings_for = self.request.query_params.getlist('show_meetings_for', None)

        tasks = Task.objects.none()
        meetings = Meeting.objects.none()

        if show_tasks == 1 or show_tasks == '1':
            # filter all viewable tasks, that are assigned to the current user, and that have a start and due date
            tasks = self.get_tasks_queryset()
            # overwrite filter class for tasks
            self.filterset_class = TaskFilter
            tasks = self.filter_queryset(tasks)

        if show_meetings == 1 or show_meetings == '1':
            # filter all viewable meetings, that are attending to the current user
            if show_meetings_for:
                meetings = self.get_meetings_queryset(show_meetings_for)
            # for the ical_export we need to set the user
            else:
                current_user = get_current_user()
                meetings = self.get_meetings_queryset(str(current_user.pk))

        return tasks, meetings

    def list(self, request, *args, **kwargs):
        tasks, meetings = self.get_filtered_schedule_elements()

        serialized_tasks = MinimalisticTaskSerializer(
            tasks, many=True, context={'request': self.request}
        ).data

        serialized_meetings = MinimalisticMeetingSerializer(
            meetings, many=True, context={'request': self.request}
        ).data

        return Response(serialized_tasks + serialized_meetings)

    @action(detail=False, methods=['GET'], url_path="get_export_link", url_name="get_export_link")
    def get_ical_export_link(self, request, *args, **kwargs):
        """
        Generates a link with a JWT for the ical export endpoint
        This is necessary so browsers can access the exported content without sending authorization headers
        """

        path = request.get_full_path().replace('get_export_link', 'export')
        jwt_url = build_jwt_url(request, path)

        # convert the absolute_url to a short_url
        from eric.short_url.models import ShortURL
        short_url = ShortURL.objects.create(url=jwt_url)

        return Response({
            'url': short_url.get_short_url()
        })

    @action(detail=False, methods=['GET'], url_path="export")
    def ical_export(self, *args, **kwargs):
        """Endpoint for the iCal export"""
        tasks, meetings = self.get_filtered_schedule_elements()

        calendar = vobject.iCalendar()
        calendar.add('method').value = 'PUBLISH'  # IE/Outlook needs this

        # iterate over all meetings
        for meeting in meetings:
            meeting.export_as_ical(calendar)

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

        cal_stream = calendar.serialize()

        response = HttpResponse(cal_stream)
        response['Content-Type'] = 'text/calendar'
        response['Filename'] = 'myschedule.ics'  # IE needs this
        response['Content-Disposition'] = 'inline; filename=myschedule.ics'

        return response
