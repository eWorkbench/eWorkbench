#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.contrib.auth.models import Group
from eric.core.rest.viewsets import BaseAuthenticatedReadOnlyModelViewSet
from eric.public_user_groups.rest.serializers import PublicUserGroupsSerializer
from eric.settings.base import PUBLIC_USER_GROUPS


class PublicUserGroupsViewSet(BaseAuthenticatedReadOnlyModelViewSet):
    """ Viewsets for public usergroups """
    serializer_class = PublicUserGroupsSerializer
    queryset = Group.objects.none()

    pagination_class = None

    def get_queryset(self):
        queryset = Group.objects.filter(name__in=PUBLIC_USER_GROUPS)
        search = self.request.query_params.get('search', None)
        if search is not None:
            queryset = queryset.filter(name__icontains=search)
        return queryset.order_by('name')
