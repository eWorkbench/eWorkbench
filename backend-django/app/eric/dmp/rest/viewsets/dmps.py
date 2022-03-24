#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from rest_framework import viewsets
from rest_framework.decorators import action

from django.db.models import Prefetch
from django.contrib.contenttypes.models import ContentType
from django_changeset.models import ChangeSet
from django.template.loader import render_to_string
from django.utils.translation import gettext_lazy as _
from django.http import HttpResponse
from rest_framework.response import Response

from eric.core.rest.viewsets import DeletableViewSetMixIn, ExportableViewSetMixIn
from eric.dmp.rest.filters import DmpFilter
from eric.projects.rest.viewsets.base import BaseAuthenticatedCreateUpdateWithoutProjectModelViewSet, \
    LockableViewSetMixIn
from eric.dmp.models import Dmp, DmpFormData, DmpForm
from eric.dmp.rest.serializers import DmpSerializerExtended
from eric.projects.rest.serializers import ChangeSetSerializer


class DmpViewSet(
    BaseAuthenticatedCreateUpdateWithoutProjectModelViewSet, DeletableViewSetMixIn, ExportableViewSetMixIn,
    LockableViewSetMixIn
):
    """ Viewset for dmps """
    serializer_class = DmpSerializerExtended
    filterset_class = DmpFilter
    search_fields = ()

    ordering_fields = ('title', 'dmp_form', 'status', 'created_at', 'created_by', 'last_modified_at',
                       'last_modified_by')

    @action(detail=True, methods=['POST'])
    def duplicate(self, request, format=None, *args, **kwargs):
        """
        Duplicates the DMP with all its answers.
        """
        dmp_object = Dmp.objects.viewable().get(pk=kwargs['pk'])
        duplicate_metadata = request.data.get('duplicate_metadata', False)

        # Duplicates the DMP and changes the name to "Copy of" + DMP title
        duplicated_dmp = dmp_object.duplicate(
            title=_("Copy of") + f" {dmp_object.title}",
            status=Dmp.NEW,
            dmp_form=dmp_object.dmp_form,
            projects=dmp_object.projects.all().values_list("pk", flat=True),
            metadata=dmp_object.metadata.all() if duplicate_metadata else None,
            old_dmp_pk=dmp_object.pk,
        )

        serializer = self.get_serializer(duplicated_dmp)

        return Response(serializer.data)

    def get_queryset(self):
        """
        returns the queryset for DMP viewable objects,
        filtered by project primary key (optional)
        :return:
        """
        return Dmp.objects.viewable().prefetch_related(
            'changesets',
            'projects',
            Prefetch('dmp_form', queryset=DmpForm.objects.viewable()),
            Prefetch('dmp_form_data', queryset=DmpFormData.objects.viewable())
        )

    @action(detail=True, methods=['GET'])
    def export(self, request, format=None, *args, **kwargs):
        """ Endpoint for the DMP Export """
        if 'type' in request.query_params:
            type = request.query_params['type']
        else:
            type = 'pdf'

        if type == 'pdf':
            return ExportableViewSetMixIn.export(self, request, *args, **kwargs)

        dmp_object = Dmp.objects.get(pk=kwargs['pk'])
        dmp_form_data_objects = DmpFormData.objects.filter(dmp=dmp_object.pk)
        context = {
            'dmp': dmp_object,
            'dmp_form_data': dmp_form_data_objects,
        }

        if type == 'html':
            filepath = 'export/export_html.html'
            filename = 'dmpexport.html'
            export = render_to_string(filepath, context)

        elif type == 'txt':
            filepath = 'export/export_txt.txt'
            filename = 'dmpexport.txt'
            export = render_to_string(filepath, context).replace("\n", "\r\n")
        elif type == 'xml':
            filepath = 'export/export_xml.xml'
            filename = 'dmpexport.xml'
            export = render_to_string(filepath, context)

        response = HttpResponse(export)
        response['Content-Disposition'] = 'attachment; filename="{}"'.format(filename)
        # Deactivate debug toolbar by setting content type != text/html
        response['Content-Type'] = 'download;'
        return response


class DmpChangeSetViewSet(viewsets.ReadOnlyModelViewSet):
    """ Viewsets for changesets in dmps """
    serializer_class = ChangeSetSerializer
    queryset = ChangeSet.objects.none()

    def get_queryset(self):
        return ChangeSet.objects.filter(object_type=ContentType.objects.get_for_model(Dmp))
