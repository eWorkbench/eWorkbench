#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
""" URL Configuration for shared elements """
from django.conf.urls import include
from django.urls import re_path
from django.views.decorators.csrf import csrf_exempt

from rest_framework_nested import routers

from eric.core.rest.routers import get_api_router
from eric.model_privileges.rest.viewsets import ModelPrivilegeViewSet
from eric.pictures.rest.viewsets import PictureViewSet
from eric.pictures.views import ConvertTiffToPngView
from eric.projects.rest.viewsets import GenericChangeSetViewSet
from eric.relations.rest.viewsets import RelationViewSet

# register REST API Routers
router = get_api_router()

"""
Pictures
with history and relations
"""
router.register(r"pictures", PictureViewSet, basename="picture")

pictures_router = routers.NestedSimpleRouter(router, r"pictures", lookup="picture")
pictures_router.register(r"relations", RelationViewSet, basename="picture-relation")
pictures_router.register(r"history", GenericChangeSetViewSet, basename="picture-changeset-paginated")
pictures_router.register(r"privileges", ModelPrivilegeViewSet, basename="picture-privileges")


urlpatterns = [
    # REST Endpoints for contacts (history, relations)
    re_path(r"^", include(pictures_router.urls)),
    re_path(r"convert_tiff_to_png/", csrf_exempt(ConvertTiffToPngView.as_view()), name="convert_tiff_to_png"),
]
