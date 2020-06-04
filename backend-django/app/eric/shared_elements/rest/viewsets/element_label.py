#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from eric.projects.rest.viewsets.base import BaseAuthenticatedModelViewSet

from eric.shared_elements.models import ElementLabel
from eric.shared_elements.rest.filters import ElementLabelFilter
from eric.shared_elements.rest.serializers import ElementLabelSerializer


class ElementLabelViewSet(
    BaseAuthenticatedModelViewSet
):
    """ REST API ViewSet for Contacts """
    serializer_class = ElementLabelSerializer
    filterset_class = ElementLabelFilter

    # disable pagination for this endpoint
    pagination_class = None

    search_fields = ()
    ordering_fields = ('first_name', 'last_name',)

    def get_queryset(self):
        """
        returns the queryset for viewable Contacts with the first changeset (insert changeset - used to enhance
        performance when querying created_by and created_at)
        """
        return ElementLabel.objects.viewable().prefetch_common()
