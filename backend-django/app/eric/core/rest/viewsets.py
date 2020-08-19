# -*- coding: utf-8 -*-
#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import os.path as path

from django.db import transaction
from django.http import HttpResponse
from django.template.loader import render_to_string
from django.utils.encoding import force_text
from django.utils.timezone import datetime
from django_changeset.models import RevisionModelMixin
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets, filters, permissions, status
from rest_framework.decorators import action
from rest_framework.pagination import LimitOffsetPagination
from rest_framework.response import Response
from weasyprint import HTML

from eric.jwt_auth.jwt_utils import build_expiring_jwt_url
from eric.search.rest.filters import FTSSearchFilter


class BaseViewSetMixin:
    """
    Represents an abstract viewset which automatically adds filter_backends (DjangoFilterBackend, FTSSearchFilter,
    OrderingFilter), permission class (IsAuthenticated), and a pagination_class.
    """
    # default filter backends
    filter_backends = (
        FTSSearchFilter,
        DjangoFilterBackend,
        filters.OrderingFilter,  # add ordering filter, but need to specify ordering_fields (default = PK)
    )
    # default permission: User needs to be authenticated
    permission_classes = (permissions.IsAuthenticated,)
    # activate pagination
    pagination_class = LimitOffsetPagination
    # set default ordering fields to the PK
    ordering_fields = ('pk',)


class BaseGenericViewSet(BaseViewSetMixin, viewsets.GenericViewSet):
    pass


class BaseModelViewSet(viewsets.ModelViewSet):
    """
    Base Model ViewSet which provides the create and update methods for our REST API, such that rendering the
    Response (from the serializer) is done without the Revision Model being enabled (using
    RevisionModelMixin.set_enabled(False) and RevisionModelMixin.set_enabled(True) ).
    This boosts the performance of create/update API calls
    """

    def create(self, request, force_request_data=None, *args, **kwargs):
        """ Creates a new element. """

        # force_request_data:
        #   JSONField doesn't parse JSON data sent via API, therefore it can be necessary
        #   to fake HTML input by passing a MultiValueDict as data to the serializer.
        #   See also JSONField.get_value (.../rest_framework/fields.py)

        request_data = request.data if force_request_data is None else force_request_data

        # the following code is from ModelViewSet.create
        serializer = self.get_serializer(data=request_data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)

        # temporarily disable revision model mixin for the response -> performance boost
        RevisionModelMixin.set_enabled(False)
        response = Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
        RevisionModelMixin.set_enabled(True)

        return response

    def update(self, request, force_request_data=None, *args, **kwargs):
        """ Updates an existing element. """

        # force_request_data:
        #   JSONField doesn't parse JSON data sent via API, therefore it can be necessary
        #   to fake HTML input by passing a MultiValueDict as data to the serializer.
        #   See also JSONField.get_value (.../rest_framework/fields.py)

        request_data = request.data if force_request_data is None else force_request_data

        # the following code is from MOdelViewSet.update
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request_data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        if getattr(instance, '_prefetched_objects_cache', None):
            # If 'prefetch_related' has been applied to a queryset, we need to
            # forcibly invalidate the prefetch cache on the instance.
            instance._prefetched_objects_cache = {}

        # temporarily disable revision model mixin for the response -> performance boost
        RevisionModelMixin.set_enabled(False)
        response = Response(serializer.data)
        RevisionModelMixin.set_enabled(True)

        return response


class BaseAuthenticatedModelViewSet(BaseViewSetMixin, BaseModelViewSet):
    """
    Represents an abstract viewset which automatically adds filter_backends (DjangoFilterBackend, SearchFilter,
    OrderingFilter), permission class (IsAuthenticated), and a pagination_class.
    """

    def filter_queryset(self, qs):
        """
        Hacky method for ensuring that get_object call (detail/get) does not apply the filter_queryset method
        see https://github.com/encode/django-rest-framework/issues/5412 for more details why this is necessary
        :rtype: QuerySet
        """
        # only apply filters for the action "list"
        if self.action == 'list':
            return super(BaseAuthenticatedModelViewSet, self).filter_queryset(qs)

        return qs

    def perform_destroy(self, instance):
        """
        Performs Destroy in an atomic transaction
        """
        with transaction.atomic():
            instance.delete()


class DeletableViewSetMixIn(object):
    """
    Viewset Mixin providing soft-delete functionality
    """

    @action(detail=True, methods=['PATCH'])
    def soft_delete(self, request, pk=None):
        """ Trashes the element. """

        obj = self.get_object()
        obj.deleted = True
        obj.save()

        return Response(self.get_serializer(instance=obj).data)

    @action(detail=True, methods=['PATCH'])
    def restore(self, request, pk=None):
        """ Restores a trashed element. """

        obj = self.get_object()
        obj.deleted = False
        obj.save()

        return Response(self.get_serializer(instance=obj).data)


class ExportableViewSetMixIn(object):
    """
    ViewSet Mixin providing export functionality as a detail route
    """

    @action(detail=True, methods=['GET'])
    def get_export_link(self, request, pk=None):
        """
        Generates a link with a JWT for the export endpoint.
        This is necessary so browsers can access the exported content without sending authorization headers.
        """

        # try to get the object to force a permission check
        self.get_object()

        path = request.path.replace('get_export_link', 'export')

        return Response({
            'url': build_expiring_jwt_url(request, path)
        })

    @action(detail=True, methods=['GET'], url_path="export")
    def export(self, request, pk=None):
        """ Exports the object as PDF file. """

        if request.user.is_anonymous:
            return HttpResponse(status=status.HTTP_401_UNAUTHORIZED)

        obj = self.get_object()

        # verify that the model has export_template set
        if not hasattr(obj._meta, "export_template"):
            return Response({
                "error": "Model {} does not define export_template in Meta Class".format(obj.__class__.__name__)
            }, status=status.HTTP_400_BAD_REQUEST)

        # define template and output filename
        filepath = obj._meta.export_template
        filename = "{basename}-{pk}.pdf".format(
            basename=path.splitext(path.basename(filepath))[0],
            pk=obj.pk
        )

        # if the class to be exported is a LabBook we need to provide more data due to
        # child elements of LabBooks and Sections
        if obj.__class__.__name__ == 'LabBook':
            # get all viewable child_elements, that's all in the labbook and all in all sections
            labbook_child_elements = obj.child_elements.viewable()

            # get a list of all section elements
            sections = []
            for labbook_child_element in labbook_child_elements:
                if labbook_child_element.is_labbook_section:
                    sections.append(labbook_child_element)

            # make a dict of all sections as keys and their child elements as values
            section_child_elements = {}
            child_elements_to_remove = []
            for section in sections:
                # get the viewable child elements of a section
                child_elements = section.child_object.child_elements.viewable()
                # add to the dict
                section_child_elements[section.pk] = child_elements
                # iterate over the section child elements and add them to list that can be used
                # to filter labbook_child_elements
                for child_element in child_elements:
                    child_elements_to_remove.append(child_element.pk)

            # filter out the child elements which are in sections to get the top level LabBook child elements
            labbook_child_elements = labbook_child_elements.exclude(
                pk__in=child_elements_to_remove
            )

            # provide a context for rendering including labbook_child_elements and section_child_elements
            context = {
                'instance': obj,
                'now': datetime.now(),
                'labbook_child_elements': labbook_child_elements,
                'section_child_elements': section_child_elements
            }
        # provide a context for rendering of all other classes then LabBooks
        else:
            context = {
                'instance': obj,
                'now': datetime.now()
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


class BaseAuthenticatedReadOnlyModelViewSet(BaseViewSetMixin, viewsets.ReadOnlyModelViewSet):
    """
    Represents an abstract read only viewset
    """


class BaseAuthenticatedUpdateOnlyModelViewSet(BaseViewSetMixin, viewsets.GenericViewSet, viewsets.mixins.ListModelMixin,
                                              viewsets.mixins.RetrieveModelMixin, viewsets.mixins.UpdateModelMixin):
    """
    Represents an abstract update only viewset
    """
