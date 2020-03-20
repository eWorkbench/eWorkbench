#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
""" URL Configuration for shared elements """
from django.conf.urls import url, include
from django.views.decorators.csrf import csrf_exempt

from rest_framework_nested import routers

from eric.core.rest.routers import get_api_router
from eric.pictures.views import ConvertTiffToPngView

from eric.projects.rest.viewsets import GenericChangeSetViewSet
from eric.model_privileges.rest.viewsets import ModelPrivilegeViewSet
from eric.relations.rest.viewsets import RelationViewSet
from eric.pictures.rest.viewsets import PictureViewSet

# register REST API Routers
router = get_api_router()

"""
Pictures
with history and relations
"""
router.register(r'pictures', PictureViewSet, base_name='picture')

pictures_router = routers.NestedSimpleRouter(router, r'pictures', lookup='picture')
pictures_router.register(r'relations', RelationViewSet, base_name='picture-relation')
pictures_router.register(r'history', GenericChangeSetViewSet,
                         base_name='picture-changeset-paginated')
pictures_router.register(r'privileges', ModelPrivilegeViewSet, base_name='picture-privileges')


urlpatterns = [
    # REST Endpoints for contacts (history, relations)
    url(r'^', include(pictures_router.urls)),
    url(r'convert_tiff_to_png/', csrf_exempt(ConvertTiffToPngView.as_view()), name='convert_tiff_to_png')
]
