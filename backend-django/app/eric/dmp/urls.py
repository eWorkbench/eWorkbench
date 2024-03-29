#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
"""
URL Configuration for eric dmp
"""
from django.conf.urls import include
from django.urls import re_path

from rest_framework_nested import routers

from eric.core.rest.routers import get_api_router
from eric.dmp.rest.viewsets.dmp_form_data import DmpFormDataChangeSetViewSet, DmpFormDataViewSet
from eric.dmp.rest.viewsets.dmp_forms import DmpFormViewSet

# dmp
from eric.dmp.rest.viewsets.dmps import DmpChangeSetViewSet, DmpViewSet
from eric.model_privileges.rest.viewsets import ModelPrivilegeViewSet
from eric.projects.rest.viewsets import GenericChangeSetViewSet
from eric.relations.rest.viewsets import RelationViewSet

# register REST API Routers
router = get_api_router()


# dmp forms - available globally
router.register(r"dmpforms", DmpFormViewSet)

"""
DMPS
with history and relations and dmp form data
"""
router.register(r"dmps", DmpViewSet, basename="dmp")

dmp_router = routers.NestedSimpleRouter(router, r"dmps", lookup="dmp")
dmp_router.register(r"relations", RelationViewSet, basename="dmp-relation")
dmp_router.register(r"history", GenericChangeSetViewSet, basename="dmp-changeset-paginated")
dmp_router.register(r"privileges", ModelPrivilegeViewSet, basename="dmp-privileges")

dmp_router.register(r"data", DmpFormDataViewSet, basename="dmpformdata")

urlpatterns = [
    # REST Endpoints for dmps (history, relations)
    re_path(r"^", include(dmp_router.urls)),
]
