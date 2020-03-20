#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from eric.core.rest.routers import get_api_router

from eric.public_user_groups.rest.viewsets import PublicUserGroupsViewSet

router = get_api_router()

router.register(r'usergroups', PublicUserGroupsViewSet, 'usergroups')


urlpatterns = [
]
