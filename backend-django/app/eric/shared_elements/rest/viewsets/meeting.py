#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import vobject
from django.contrib.auth import get_user_model
from django.http import HttpResponse
from django.template.loader import render_to_string
from django.utils.encoding import force_text
from django.utils.timezone import datetime
from django_userforeignkey.request import get_current_user
from rest_framework import viewsets, mixins
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.viewsets import GenericViewSet
from weasyprint import HTML

from eric.core.rest.viewsets import DeletableViewSetMixIn, ExportableViewSetMixIn, BaseAuthenticatedModelViewSet, \
    BaseViewSetMixin
from eric.core.utils import convert_html_to_text
from eric.jwt_auth.jwt_utils import build_jwt_url
from eric.model_privileges.models import ModelPrivilege
from eric.projects.rest.viewsets.base import BaseAuthenticatedCreateUpdateWithoutProjectModelViewSet, \
    LockableViewSetMixIn
from eric.shared_elements.models import Meeting, UserAttendsMeeting
from eric.shared_elements.rest.filters import MeetingFilter, AnonymousMeetingFilter
from eric.shared_elements.rest.serializers import MeetingSerializer
from eric.shared_elements.rest.serializers.meeting import AnonymousResourceBookingSerializer


class MeetingViewSet(
    BaseAuthenticatedCreateUpdateWithoutProjectModelViewSet, DeletableViewSetMixIn, ExportableViewSetMixIn,
    LockableViewSetMixIn
):
    serializer_class = MeetingSerializer
    filterset_class = MeetingFilter
    search_fields = ()
    ordering_fields = ('date_time_start', 'date_time_end', 'title', 'location', 'created_at', 'created_by',
                       'last_modified_at', 'last_modified_by')

    def perform_create(self, serializer):
        """
        Ensure that the current user is always attending the meeting they created, unless the current user creates
        a meeting for another user through calendar access privileges

        We need to do this here (rather than in a pre_save/post_save handler)
        """
        instance = serializer.save()

        if instance.create_for:
            User = get_user_model()
            create_for_user = User.objects.filter(pk=instance.create_for).first()
            if create_for_user:
                # add the create_for_user to attending users here
                UserAttendsMeeting.objects.get_or_create(
                    meeting=instance,
                    user=create_for_user,
                )
                # also give the create_for_user full access privileges for the meeting
                ModelPrivilege.objects.get_or_create(
                    content_type=Meeting.get_content_type(),
                    object_id=instance.pk,
                    user=create_for_user,
                    full_access_privilege=ModelPrivilege.ALLOW
                )
        else:
            UserAttendsMeeting.objects.get_or_create(
                meeting=instance,
                user=get_current_user(),
            )

    def get_queryset(self):
        """
        returns the queryset for ProjectRoleUserAssignment viewable objects,
        filtered by project primary (optional)
        """
        return Meeting.objects.viewable().prefetch_common(). \
            prefetch_related('projects', )

    @action(detail=False, methods=['GET'], url_path="get_export_link")
    def get_ical_export_link(self, request, *args, **kwargs):
        """
        Generates a link with a JWT for the ical export endpoint
        This is necessary so browsers can access the exported content without sending authorization headers
        """

        path = request.get_full_path().replace('get_export_link', 'export')

        return Response({
            'url': build_jwt_url(request, path)
        })

    @action(detail=False, methods=['GET'], url_path="export")
    def ical_export(self, *args, **kwargs):
        """Endpoint for the iCal export"""

        self.action = "list"
        meetings = self.filter_queryset(self.get_queryset())

        # TODO: Use Meeting.export_as_ical()

        calendar = vobject.iCalendar()
        calendar.add('method').value = 'PUBLISH'  # IE/Outlook needs this
        for meeting in meetings:
            event = calendar.add('vevent')
            event.add('dtstart').value = meeting.date_time_start  # ical_datetime_start
            event.add('dtend').value = meeting.date_time_end  # ical_datetime_end  # TODO
            event.add('summary').value = meeting.title
            event.add('uid').value = str(meeting.pk)
            event.add('description').value = convert_html_to_text(meeting.text)
            event.add('organizer').value = "MAILTO: %(organizer)s" % {'organizer': meeting.created_by.email}

            if meeting.location:
                event.add('location').value = meeting.location

            # add attending users
            for user in meeting.attending_users.all():
                event.add('attendee').value = "MAILTO: %(attendee)s" % {'attendee': user.email}

            for contact in meeting.attending_contacts.all():
                event.add('attendee').value = "MAILTO: %(attendee)s" % {'attendee': contact.email}

        cal_stream = calendar.serialize()

        response = HttpResponse(cal_stream)
        response['Content-Type'] = 'text/calendar'
        response['Filename'] = 'calendar.ics'  # IE needs this
        response['Content-Disposition'] = 'inline; filename=calendar.ics'

        return response


class MyMeetingViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = MeetingSerializer
    filterset_class = MeetingFilter
    search_fields = ()

    # disable pagination for this endpoint
    pagination_class = None

    def get_queryset(self):
        return Meeting.objects.viewable().prefetch_common().prefetch_related('projects')


class MyResourceBookingViewSet(BaseAuthenticatedModelViewSet, ExportableViewSetMixIn):
    serializer_class = MeetingSerializer
    filter_class = MeetingFilter
    search_fields = ()
    ordering_fields = ('resource__name', 'resource__type', 'resource__description', 'resource__location',
                       'attending_users', 'date_time_start', 'date_time_end',
                       'text', 'created_by', 'created_at')

    # disable pagination for this endpoint
    pagination_class = None

    def get_queryset(self):
        return Meeting.objects.my_bookings().prefetch_common().prefetch_related(
            'projects'
        ).filter(deleted=False).filter(resource__deleted=False)

    @action(detail=True, methods=['GET'])
    def export(self, request, format=None, *args, **kwargs):
        """ Endpoint for the MyResourceBooking Export """

        return ExportableViewSetMixIn.export(self, request, *args, **kwargs)

    @action(detail=False, methods=['GET'], url_path='export_many/(?P<pk_list>[^/.]+)')
    def export_many(self, request, pk_list, *args, **kwargs):
        """ Endpoint for the MyResourceBooking Export """
        now = datetime.now()

        booking_pks = pk_list.split(',')

        booking_objects = Meeting.objects.filter(pk__in=booking_pks)

        filepath = 'export/meeting_many.html'
        filename = 'appointment_resource_bookings_{}.pdf'.format(now)

        # provide a context for rendering
        context = {
            'instances': booking_objects,
            'now': now
        }

        # render the HTML to a string
        export = render_to_string(filepath, context)
        # and convert it into a PDF document
        pdf_document = HTML(string=force_text(export).encode('UTF-8')).render()
        export = pdf_document.write_pdf()

        # finally, respond with the PDF document
        response = HttpResponse(export)
        # inline content -> enables displaying the file in the browser
        response['Content-Disposition'] = 'inline; filename="{}"'.format(filename)
        # Deactivate debug toolbar by setting content type != text/html
        response['Content-Type'] = 'application/pdf;'

        return response


class AllResourceBookingViewSet(BaseViewSetMixin, mixins.ListModelMixin, GenericViewSet):
    serializer_class = MeetingSerializer
    filter_class = AnonymousMeetingFilter
    search_fields = ()
    ordering_fields = ('resource__name', 'resource__type', 'resource__description', 'resource__location',
                       'attending_users', 'date_time_start', 'date_time_end',
                       'text', 'created_by', 'created_at')

    # disable pagination for this endpoint
    pagination_class = None

    def get_queryset(self):
        return Meeting.objects \
            .filter(deleted=False, resource__deleted=False, resource__isnull=False) \
            .prefetch_common() \
            .prefetch_related('projects')

    def list(self, request, *args, **kwargs):
        # apply ViewSet filters
        meetings_qs = self.filter_queryset(self.get_queryset())

        # build query for bookings with access to all data
        full_info_qs = meetings_qs.fully_viewable()
        full_info_meetings = self.serializer_class(
            full_info_qs, many=True, context={'request': self.request}
        ).data

        # build query for bookings with limited data
        limited_info_qs = meetings_qs.difference(full_info_qs)
        limited_info_meetings = AnonymousResourceBookingSerializer(
            limited_info_qs, many=True, context={'request': self.request}
        ).data

        return Response(full_info_meetings + limited_info_meetings)
