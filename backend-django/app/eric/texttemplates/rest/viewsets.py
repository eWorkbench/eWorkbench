#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from rest_framework import viewsets
from django.contrib.contenttypes.models import ContentType

from django_changeset.models import ChangeSet

from eric.core.rest.viewsets import BaseAuthenticatedReadOnlyModelViewSet
from eric.texttemplates.models import TextTemplate
from eric.texttemplates.rest.serializers import TextTemplateSerializer
from eric.projects.rest.serializers import ChangeSetSerializer


class TextTemplateViewSet(BaseAuthenticatedReadOnlyModelViewSet):
    """ Viewset for text templates """
    serializer_class = TextTemplateSerializer
    queryset = TextTemplate.objects.all()

    # disable pagination for this endpoint
    pagination_class = None


class TextTemplateChangeSetViewSet(viewsets.ReadOnlyModelViewSet):
    """ Viewsets for changesets in text templates """
    serializer_class = ChangeSetSerializer
    queryset = ChangeSet.objects.none()

    def get_queryset(self):
        return ChangeSet.objects.filter(object_type=ContentType.objects.get_for_model(TextTemplate))
