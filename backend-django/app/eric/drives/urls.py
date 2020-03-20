#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.conf.urls import url, include
from rest_framework_nested import routers

from eric.core.rest.routers import get_api_router
from eric.projects.rest.viewsets import GenericChangeSetViewSet
from eric.model_privileges.rest.viewsets import ModelPrivilegeViewSet
from eric.relations.rest.viewsets import RelationViewSet

from eric.drives.rest.viewsets import DriveViewSet, DriveSubDirectoriesViewSet

# register REST API Routers
router = get_api_router()

router.register(r'drives', DriveViewSet, base_name='drive')

drive_router = routers.NestedSimpleRouter(router, r'drives', lookup='drive')
drive_router.register(r'relations', RelationViewSet, base_name='drive-relation')
drive_router.register(r'history', GenericChangeSetViewSet,
                      base_name='drive-changeset-paginated')
drive_router.register(r'privileges', ModelPrivilegeViewSet, base_name='drive-privileges')

# register sub view for all sub directories of the drive
drive_router.register(r'sub_directories', DriveSubDirectoriesViewSet, base_name='drive-sub_directories')

urlpatterns = [
    url(r'^', include(drive_router.urls)),
]
