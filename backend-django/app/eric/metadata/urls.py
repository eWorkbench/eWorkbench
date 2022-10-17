#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.conf.urls import include
from django.urls import re_path

from eric.core.rest.routers import get_api_router
from eric.metadata.rest.viewsets import MetadataFieldViewSet, MetadataSearchViewSet, MetadataTagViewSet

router = get_api_router()
urls = []

# /api/.../metadata -- DISABLED, because unused at the moment
# def add_sub_urls(endpoint, viewset, model_name):
#     router.register(endpoint, viewset, basename=model_name)
#
#     sub_router = routers.NestedSimpleRouter(router, endpoint, lookup=model_name)
#     sub_router.register(r'metadata', MetadataViewSet, basename='%s-metadata'.format(model_name))
#
#     urls.extend(sub_router.urls)
# add_sub_urls(r'tasks', TaskViewSet, 'task')
# add_sub_urls(r'contacts', ContactViewSet, 'contact')
# add_sub_urls(r'notes', NoteViewSet, 'note')
# add_sub_urls(r'meetings', MeetingViewSet, 'meeting')
# add_sub_urls(r'pictures', PictureViewSet, 'picture')
# add_sub_urls(r'files', FileViewSet, 'file')
# add_sub_urls(r'labbooks', LabBookViewSet, 'labbook')
# add_sub_urls(r'dmps', DmpViewSet, 'dmp')

# /api/metadatafields
router.register(r"metadatafields", MetadataFieldViewSet, basename="metadatafield")

# /api/metadata-search
router.register(r"metadata-search", MetadataSearchViewSet, basename="metadata-search")

# /api/metadata-search
router.register(r"metadata/tags", MetadataTagViewSet, basename="metadata-tag")

urlpatterns = [
    re_path(r"^", include(urls)),
]
