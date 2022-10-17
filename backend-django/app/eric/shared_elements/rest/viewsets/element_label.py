#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from eric.projects.rest.viewsets.base import BaseAuthenticatedModelViewSet
from eric.shared_elements.models import ElementLabel
from eric.shared_elements.rest.filters import ElementLabelFilter
from eric.shared_elements.rest.serializers import ElementLabelSerializer


class ElementLabelViewSet(BaseAuthenticatedModelViewSet):
    """Handles generic element labels."""

    serializer_class = ElementLabelSerializer
    filterset_class = ElementLabelFilter

    # disable pagination for this endpoint
    pagination_class = None

    search_fields = ()
    ordering_fields = (
        "first_name",
        "last_name",
    )

    def get_queryset(self):
        return ElementLabel.objects.viewable().prefetch_common()
