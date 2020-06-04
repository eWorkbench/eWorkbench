#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import jwt
import vobject
from django.conf import settings
from django.http import HttpResponse
from django.template.loader import render_to_string
from django_filters.rest_framework import DjangoFilterBackend
from django_userforeignkey.request import get_current_user
from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils.timezone import datetime

from eric.core.rest.viewsets import DeletableViewSetMixIn, ExportableViewSetMixIn, BaseAuthenticatedModelViewSet
from eric.core.utils import convert_html_to_text
from eric.projects.rest.viewsets.base import BaseAuthenticatedCreateUpdateWithoutProjectModelViewSet, \
    LockableViewSetMixIn
from eric.search.rest.filters import FTSSearchFilter
from eric.shared_elements.models import Meeting, UserAttendsMeeting
from eric.shared_elements.rest.filters import MeetingFilter
from eric.shared_elements.rest.serializers import MeetingSerializer
from weasyprint import HTML
from django.utils.encoding import force_text


class MeetingViewSet(
    BaseAuthenticatedCreateUpdateWithoutProjectModelViewSet, DeletableViewSetMixIn, ExportableViewSetMixIn,
    LockableViewSetMixIn
):
    """ Viewset for meetings """
    serializer_class = MeetingSerializer
    filterset_class = MeetingFilter
    search_fields = ()

    ordering_fields = ('date_time_start', 'date_time_end', 'title', 'location', 'created_at', 'created_by',
                       'last_modified_at', 'last_modified_by')

    def perform_create(self, serializer):
        """
        Ensure that the current user is always attending the meeting they created

        We need to do this here (rather than in a pre_save/post_save handler)
        :param serializer:
        :return:
        """
        instance = serializer.save()

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
        :param request:
        :param pk:
        :return:
        """
        # get the current request path/url and replace "get_export_token" with the target url (which is "export")
        path = request.get_full_path()
        path = path.replace('get_export_link', 'export')

        # build an absolute URL for the given apth
        absolute_url = request.build_absolute_uri(path)

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

        # return the URL
        return Response({
            'url': absolute_url
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
    """ Viewset for meetings """
    serializer_class = MeetingSerializer
    filterset_class = MeetingFilter
    search_fields = ()

    # disable pagination for this endpoint
    pagination_class = None

    def get_queryset(self):
        return Meeting.objects.viewable().prefetch_common().prefetch_related('projects')


class MyResourceBookingViewSet(BaseAuthenticatedModelViewSet, ExportableViewSetMixIn):
    """ Viewset for meetings """
    serializer_class = MeetingSerializer
    filter_class = MeetingFilter
    search_fields = ()

    ordering_fields = ('resource__name', 'resource__type', 'resource__description', 'resource__location',
                       'attending_users', 'date_time_start', 'date_time_end',
                       'text', 'created_by', 'created_at')

    # disable pagination for this endpoint
    pagination_class = None

    def get_queryset(self):
        return Meeting.objects.resourcebookings_my_viewable().prefetch_common().prefetch_related(
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


class AllResourceBookingViewSet(BaseAuthenticatedModelViewSet):
    """ Viewset for meetings """
    serializer_class = MeetingSerializer
    filter_class = MeetingFilter
    search_fields = ()

    ordering_fields = ('resource__name', 'resource__type', 'resource__description', 'resource__location',
                       'attending_users', 'date_time_start', 'date_time_end',
                       'text', 'created_by', 'created_at')

    # disable pagination for this endpoint
    pagination_class = None

    def get_queryset(self):
        return Meeting.objects.resourcebookings_all_viewable().prefetch_common().prefetch_related(
            'projects'
        ).filter(deleted=False).filter(resource__deleted=False)
