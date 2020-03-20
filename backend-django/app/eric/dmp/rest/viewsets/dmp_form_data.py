#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from rest_framework import viewsets
from django.contrib.contenttypes.models import ContentType

from django_changeset.models import ChangeSet, ChangeRecord

from eric.core.rest.viewsets import BaseAuthenticatedUpdateOnlyModelViewSet
from eric.dmp.models import DmpFormData
from eric.dmp.rest.serializers import DmpFormDataSerializerExtended
from eric.projects.rest.serializers import ChangeSetSerializer


class DmpFormDataViewSet(BaseAuthenticatedUpdateOnlyModelViewSet):
    """ Viewset for dmp form data """
    serializer_class = DmpFormDataSerializerExtended
    queryset = DmpFormData.objects.none()

    # disable pagination for this endpoint
    pagination_class = None

    def get_queryset(self):
        if 'dmp_pk' in self.kwargs:
            return DmpFormData.objects.viewable().select_related('dmp').filter(dmp=self.kwargs['dmp_pk'])
        else:
            return DmpFormData.objects.viewable().select_related('dmp')


class DmpFormDataChangeSetViewSet(viewsets.ReadOnlyModelViewSet):
    """ Viewsets for changesets in dmp form data """
    serializer_class = ChangeSetSerializer
    queryset = ChangeSet.objects.none()

    def get_queryset(self):
        return ChangeSet.objects.filter(object_type=ContentType.objects.get_for_model(DmpFormData))
