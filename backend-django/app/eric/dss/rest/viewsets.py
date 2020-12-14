#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import logging

from django_changeset.models import RevisionModelMixin

from eric.core.rest.viewsets import DeletableViewSetMixIn, ExportableViewSetMixIn, BaseAuthenticatedModelViewSet
from rest_framework import status
from rest_framework.response import Response
from eric.dss.models import DSSEnvelope, DSSContainer
from eric.dss.models.models import DSSFilesToImport
from eric.dss.rest.filters import DSSContainerFilter, DSSEnvelopeFilter, DSSFilesToImportFilter
from eric.dss.rest.serializers import DSSContainerSerializer, DSSEnvelopeSerializer, DSSFilesToImportSerializer
from eric.projects.models.exceptions import ContainerReadWriteException
from eric.projects.rest.viewsets import BaseAuthenticatedCreateUpdateWithoutProjectModelViewSet, LockableViewSetMixIn

logger = logging.getLogger('eric.dss.rest.viewsets')


class DSSContainerViewSet(BaseAuthenticatedCreateUpdateWithoutProjectModelViewSet, DeletableViewSetMixIn,
                          ExportableViewSetMixIn, LockableViewSetMixIn):
    serializer_class = DSSContainerSerializer
    filterset_class = DSSContainerFilter
    search_fields = ('name', 'path',)

    ordering_fields = ('name', 'path', 'created_at', 'created_by')

    def get_queryset(self):
        """
        returns the queryset for DSSContainer viewable objects,
        filtered by project primary (optional)
        """
        return DSSContainer.objects.viewable().prefetch_common().prefetch_related('projects')


class DSSEnvelopeViewSet(BaseAuthenticatedModelViewSet):
    serializer_class = DSSEnvelopeSerializer
    filterset_class = DSSEnvelopeFilter
    search_fields = ('path',)

    ordering_fields = ('path', 'created_at', 'created_by')

    def update(self, request, *args, **kwargs):
        if 'path' in request.data and isinstance(request.data['path'], str) and kwargs['pk']:
            # get the existing envelope
            envelope = DSSEnvelope.objects.filter(pk=kwargs['pk']).first()

            # lets get the container setting now
            container_read_write_setting = envelope.container.read_write_setting
            read_write_only_new = DSSContainer.READ_WRITE_ONLY_NEW
            if container_read_write_setting == read_write_only_new and envelope.imported:
                raise ContainerReadWriteException(read_write_only_new)

        return super(DSSEnvelopeViewSet, self).update(request, *args, **kwargs)

    def get_queryset(self):
        """
        returns the queryset for DSSEnvelope viewable objects
        """
        return DSSEnvelope.objects.all().prefetch_common()


class DSSFilesToImportViewSet(BaseAuthenticatedModelViewSet):
    serializer_class = DSSFilesToImportSerializer
    filterset_class = DSSFilesToImportFilter
    search_fields = ('path',)

    ordering_fields = ('path', 'created_at', 'created_by', 'imported', 'imported_at', 'last_import_attempt_failed_at')

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data, many=isinstance(request.data, list))
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)

        # temporarily disable revision model mixin for the response -> performance boost
        RevisionModelMixin.set_enabled(False)
        # return only the count of added paths here for performance
        count = len(serializer.data)
        data = {'count': count}
        response = Response(data, status=status.HTTP_201_CREATED, headers=headers)
        RevisionModelMixin.set_enabled(True)

        return response

    def get_queryset(self):
        """
        returns the queryset for DSSEnvelope viewable objects
        """
        return DSSFilesToImport.objects.viewable().prefetch_common()
