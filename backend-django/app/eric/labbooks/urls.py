#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.conf.urls import include
from django.urls import re_path

from rest_framework_nested import routers

from eric.core.rest.routers import get_api_router
from eric.labbooks.rest.viewsets import LabBookChildElementViewSet, LabbookSectionViewSet, LabBookViewSet
from eric.model_privileges.rest.viewsets import ModelPrivilegeViewSet
from eric.projects.rest.viewsets import GenericChangeSetViewSet

# relations
from eric.relations.rest.viewsets import RelationViewSet

# register REST API Routers
router = get_api_router()


router.register(r"labbooks", LabBookViewSet, basename="labbook")

labbook_router = routers.NestedSimpleRouter(router, r"labbooks", lookup="labbook")
labbook_router.register(r"relations", RelationViewSet, basename="labbook-relation")
labbook_router.register(r"history", GenericChangeSetViewSet, basename="labbook-changeset-paginated")
labbook_router.register(r"privileges", ModelPrivilegeViewSet, basename="labbook-privileges")

# register sub view for all child-elements of the labbook
labbook_router.register(r"elements", LabBookChildElementViewSet, basename="labbook-elements")


# LabbookSection
router.register(r"labbooksections", LabbookSectionViewSet, basename="labbooksection")

labbooksection_router = routers.NestedSimpleRouter(router, r"labbooksections", lookup="labbooksection")
labbooksection_router.register(r"relations", RelationViewSet, basename="labbooksection-relation")
labbooksection_router.register(r"history", GenericChangeSetViewSet, basename="labbooksection-changeset-paginated")
labbooksection_router.register(r"privileges", ModelPrivilegeViewSet, basename="labbooksection-privileges")

urlpatterns = [
    re_path(r"^", include(labbook_router.urls)),
    re_path(r"^", include(labbooksection_router.urls)),
]
