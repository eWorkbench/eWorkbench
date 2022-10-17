#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from eric.core.rest.viewsets import BaseAuthenticatedModelViewSet
from eric.projects.models import Role
from eric.projects.rest.filters import RoleFilter
from eric.projects.rest.serializers import MinimalisticRoleSerializer


class RoleViewSet(BaseAuthenticatedModelViewSet):
    """Viewset for Roles"""

    serializer_class = MinimalisticRoleSerializer
    queryset = Role.objects.all()
    filterset_class = RoleFilter

    # disable pagination for this endpoint
    pagination_class = None
