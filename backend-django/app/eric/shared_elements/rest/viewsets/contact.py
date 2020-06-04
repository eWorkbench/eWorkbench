#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from rest_framework import permissions
from rest_framework.mixins import CreateModelMixin
from rest_framework.viewsets import GenericViewSet

from eric.core.rest.viewsets import DeletableViewSetMixIn, ExportableViewSetMixIn
from eric.projects.rest.viewsets.base import BaseAuthenticatedCreateUpdateWithoutProjectModelViewSet, \
    LockableViewSetMixIn
from eric.shared_elements.models import Contact
from eric.shared_elements.rest.filters import ContactFilter
from eric.shared_elements.rest.serializers import ContactSerializer
from eric.shared_elements.rest.serializers.contact import ContactShareSerializer


class ContactViewSet(
    BaseAuthenticatedCreateUpdateWithoutProjectModelViewSet, DeletableViewSetMixIn, ExportableViewSetMixIn,
    LockableViewSetMixIn
):
    """ REST API ViewSet for Contacts """
    serializer_class = ContactSerializer
    filterset_class = ContactFilter

    search_fields = ()
    ordering_fields = ('first_name', 'last_name', 'email', 'created_at', 'created_by', 'academic_title', 'phone',
                       'company')

    def get_queryset(self):
        """
        returns the queryset for viewable Contacts with the first changeset (insert changeset - used to enhance
        performance when querying created_by and created_at)
        """
        return Contact.objects.viewable().prefetch_common().prefetch_related(
            'projects'
        )


class ContactShareViewSet(CreateModelMixin, GenericViewSet):
    """ REST API ViewSet to share contacts """

    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = ContactShareSerializer

    # used for sharing contacts only => no output necessary
    queryset = Contact.objects.none()
