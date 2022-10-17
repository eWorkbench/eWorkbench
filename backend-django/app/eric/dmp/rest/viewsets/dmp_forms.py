#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.contrib.contenttypes.models import ContentType

from rest_framework import viewsets

from django_changeset.models import ChangeRecord, ChangeSet

from eric.core.rest.viewsets import BaseAuthenticatedModelViewSet, BaseAuthenticatedReadOnlyModelViewSet
from eric.dmp.models import DmpForm
from eric.dmp.rest.serializers import DmpFormSerializerExtended
from eric.projects.rest.serializers import ChangeSetSerializer


class DmpFormViewSet(BaseAuthenticatedReadOnlyModelViewSet):
    """Viewset for dmp forms"""

    serializer_class = DmpFormSerializerExtended
    queryset = DmpForm.objects.all()

    # disable pagination for this endpoint
    pagination_class = None


class DmpFormChangeSetViewSet(viewsets.ReadOnlyModelViewSet):
    """Viewsets for changesets in dmp forms"""

    serializer_class = ChangeSetSerializer
    queryset = ChangeSet.objects.none()

    def get_queryset(self):
        return ChangeSet.objects.filter(object_type=ContentType.objects.get_for_model(DmpForm))
