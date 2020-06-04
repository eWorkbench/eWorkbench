#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from eric.core.rest.viewsets import DeletableViewSetMixIn, ExportableViewSetMixIn
from eric.projects.rest.viewsets.base import BaseAuthenticatedCreateUpdateWithoutProjectModelViewSet, \
    LockableViewSetMixIn

from eric.shared_elements.models import Note
from eric.shared_elements.rest.filters import NoteFilter
from eric.shared_elements.rest.serializers import NoteSerializer


class NoteViewSet(
    BaseAuthenticatedCreateUpdateWithoutProjectModelViewSet, DeletableViewSetMixIn, ExportableViewSetMixIn,
    LockableViewSetMixIn
):
    """ REST API Viewset for notes """
    serializer_class = NoteSerializer
    filterset_class = NoteFilter
    search_fields = ()

    ordering_fields = ('subject', 'created_at', 'created_by')

    def get_queryset(self):
        """
        returns the queryset for ProjectRoleUserAssignment viewable objects,
        filtered by project primary (optional)
        """
        return Note.objects.viewable().prefetch_common().prefetch_related(
            'projects'
        )
