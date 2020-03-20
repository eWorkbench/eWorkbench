#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.template.loader import render_to_string

from eric.core.rest.viewsets import BaseAuthenticatedModelViewSet
from eric.core.rest.viewsets import DeletableViewSetMixIn, ExportableViewSetMixIn
from eric.projects.rest.viewsets.base import BaseAuthenticatedCreateUpdateWithoutProjectModelViewSet, \
    LockableViewSetMixIn
from eric.projects.models import Resource, ResourceBooking
from eric.projects.rest.filters import ResourceFilter, ResourceBookingFilter, MyResourceBookingFilter
from eric.projects.rest.serializers import ResourceSerializer, ResourceBookingSerializer
from django.utils.timezone import datetime
from rest_framework.decorators import action
from django.http import StreamingHttpResponse, HttpResponse
from rest_framework.exceptions import PermissionDenied
from weasyprint import HTML
from django.utils.encoding import force_text


class ResourceViewSet(BaseAuthenticatedCreateUpdateWithoutProjectModelViewSet, DeletableViewSetMixIn,
                      ExportableViewSetMixIn, LockableViewSetMixIn):
    """ Viewset for resources """
    serializer_class = ResourceSerializer
    filter_class = ResourceFilter
    search_fields = ()

    ordering_fields = ('name', 'type', 'description', 'location', 'created_by', 'contact', 'responsible_unit',
                       'user_availability', )

    def get_queryset(self):
        """
         returns the queryset for ProjectRoleUserAssignment viewable objects,
         filtered by project primary (optional)
         """
        return Resource.objects.viewable().prefetch_common().prefetch_related('projects')

    @action(detail=True, methods=['GET'], url_path='terms-of-use-download', url_name='terms-of-use-download')
    def terms_of_use_download(self, request, *args, **kwargs):
        """
        Provides a detail route endpoint for downloading a terms of use pdf
        """
        # get all viewable resources for this user
        viewable_resources = Resource.objects.all().viewable()
        # get the resource
        resource = self.get_object()
        # check if the user has view permissions for this resource
        if viewable_resources.filter(pk=resource.pk).exists():
            # the path
            terms_of_use_path = resource.terms_of_use_pdf
            # create a file name for the header
            file_name = "Terms-of-Use-for-Resource-{}-{}.pdf".format(resource.name, resource.pk)
            # set up the response object
            response = StreamingHttpResponse(terms_of_use_path, content_type='application/pdf')
            # set filename in header
            response['Content-Disposition'] = 'attachment; filename="{}"'.format(file_name)
            return response
        # raise PermissionDenied if the user has no view permissions
        raise PermissionDenied


class ResourceBookingViewSet(BaseAuthenticatedModelViewSet):
    """ Viewset for ResourceBooking """
    serializer_class = ResourceBookingSerializer
    filter_class = ResourceBookingFilter
    search_fields = ()

    # pagination for this endpoint
    pagination_class = None

    def get_queryset(self):
        """
         returns the queryset for ResourceBookingViewSet viewable objects
         """
        return ResourceBooking.objects.viewable_all().filter(resource__deleted=False)\
            .prefetch_related('resource', 'meeting')


class MyResourceBookingViewSet(BaseAuthenticatedModelViewSet, ExportableViewSetMixIn):
    """ Viewset for ResourceBooking """
    serializer_class = ResourceBookingSerializer
    filter_class = MyResourceBookingFilter
    search_fields = ()

    ordering_fields = ('resource__name', 'resource__type', 'resource__description', 'resource__location',
                       'meeting__attending_users', 'date_time_start', 'date_time_end',
                       'comment', 'created_by', 'created_at')

    def get_queryset(self):
        """
         returns the queryset for MyResourceBookingViewSet viewable objects for the current user
         """
        return ResourceBooking.objects.viewable().filter(resource__deleted=False)\
            .prefetch_related('resource', 'meeting')

    @action(detail=True, methods=['GET'])
    def export(self, request, format=None, *args, **kwargs):
        """ Endpoint for the MyResourceBooking Export """

        return ExportableViewSetMixIn.export(self, request, *args, **kwargs)

    @action(detail=False, methods=['GET'], url_path='export_many/(?P<pk_list>[^/.]+)')
    def export_many(self, request, pk_list, *args, **kwargs):
        """ Endpoint for the MyResourceBooking Export """
        now = datetime.now()

        booking_pks = pk_list.split(',')

        booking_objects = ResourceBooking.objects.filter(pk__in=booking_pks)

        filepath = 'export/resourcebooking_many_pdf.html'
        filename = 'resourcebookings_{}.pdf'.format(now)

        # provide a context for rendering
        context = {
            'instances': booking_objects,
            'now': now
        }

        # render the HTML to a string
        export = render_to_string(filepath, context)
        # and convert it into a PDF document
        pdf_document = HTML(string=force_text(export).encode('UTF-8'), ).render()
        export = pdf_document.write_pdf()

        # finally, respond with the PDF document
        response = HttpResponse(export)
        # inline content -> enables displaying the file in the browser
        response['Content-Disposition'] = 'inline; filename="{}"'.format(filename)
        # Deactivate debug toolbar by setting content type != text/html
        response['Content-Type'] = 'application/pdf;'

        return response
