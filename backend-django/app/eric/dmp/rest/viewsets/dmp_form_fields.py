#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from rest_framework import viewsets
from django.contrib.contenttypes.models import ContentType

from django_changeset.models import ChangeSet, ChangeRecord

from eric.core.rest.viewsets import BaseAuthenticatedReadOnlyModelViewSet
from eric.dmp.models import DmpFormField
from eric.dmp.rest.serializers import DmpFormFieldSerializerExtended
from eric.projects.rest.serializers import ChangeSetSerializer


class DmpFormFieldViewSet(BaseAuthenticatedReadOnlyModelViewSet):
    """ Viewset for dmp form fields """
    serializer_class = DmpFormFieldSerializerExtended
    queryset = DmpFormField.objects.all()

    # disable pagination for this endpoint
    pagination_class = None


class DmpFormFieldChangeSetViewSet(viewsets.ReadOnlyModelViewSet):
    """ Viewsets for changesets in dmp form fields """
    serializer_class = ChangeSetSerializer
    queryset = ChangeSet.objects.none()

    def get_queryset(self):
        return ChangeSet.objects.filter(object_type=ContentType.objects.get_for_model(DmpFormField))
