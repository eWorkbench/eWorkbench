#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.urls import include, re_path
from rest_framework_nested import routers

from eric.core.rest.routers import get_api_router
from eric.dss.rest.viewsets import DSSContainerViewSet, DSSEnvelopeViewSet, DSSFilesToImportViewSet
from eric.model_privileges.rest.viewsets import ModelPrivilegeViewSet
from eric.projects.rest.viewsets import GenericChangeSetViewSet
from eric.relations.rest.viewsets import RelationViewSet

router = get_api_router()

# dsscontainers
router.register(r'dsscontainers', DSSContainerViewSet, basename='dsscontainer')
dsscontainer_router = routers.NestedSimpleRouter(router, r'dsscontainers', lookup='dsscontainer')
dsscontainer_router.register(r'relations', RelationViewSet, basename='dsscontainer-relation')
dsscontainer_router.register(r'history', GenericChangeSetViewSet, basename='dsscontainer-changeset-paginated')
dsscontainer_router.register(r'privileges', ModelPrivilegeViewSet, basename='dsscontainer-privileges')

# dssenvelopes
router.register(r'dssenvelopes', DSSEnvelopeViewSet, basename='dssenvelope')

# DSSFilesToImport
router.register(r'dssfilestoimport', DSSFilesToImportViewSet, basename='dssfilestoimport')

urlpatterns = [
    # REST Endpoints for DSS Containers and DSS Envelopes
    re_path(r'^', include(dsscontainer_router.urls)),
]
