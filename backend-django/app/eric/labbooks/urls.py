#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.conf.urls import url, include

from rest_framework_nested import routers

from eric.core.rest.routers import get_api_router

from eric.projects.rest.viewsets import GenericChangeSetViewSet
from eric.model_privileges.rest.viewsets import ModelPrivilegeViewSet

# relations
from eric.relations.rest.viewsets import RelationViewSet

from eric.labbooks.rest.viewsets import LabBookViewSet, LabBookChildElementViewSet, LabbookSectionViewSet

# register REST API Routers
router = get_api_router()


router.register(r'labbooks', LabBookViewSet, base_name='labbook')

labbook_router = routers.NestedSimpleRouter(router, r'labbooks', lookup='labbook')
labbook_router.register(r'relations', RelationViewSet, base_name='labbook-relation')
labbook_router.register(r'history', GenericChangeSetViewSet,
                        base_name='labbook-changeset-paginated')
labbook_router.register(r'privileges', ModelPrivilegeViewSet, base_name='labbook-privileges')

# register sub view for all child-elements of the labbook
labbook_router.register(r'elements', LabBookChildElementViewSet, base_name='labbook-elements')


# LabbookSection
router.register(r'labbooksections', LabbookSectionViewSet, base_name='labbooksection')

labbooksection_router = routers.NestedSimpleRouter(router, r'labbooksections', lookup='labbooksection')
labbooksection_router.register(r'relations', RelationViewSet, base_name='labbooksection-relation')
labbooksection_router.register(r'history', GenericChangeSetViewSet, base_name='labbooksection-changeset-paginated')
labbooksection_router.register(r'privileges', ModelPrivilegeViewSet, base_name='labbooksection-privileges')

urlpatterns = [
    url(r'^', include(labbook_router.urls)),
    url(r'^', include(labbooksection_router.urls)),
]
