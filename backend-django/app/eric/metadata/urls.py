#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.conf.urls import url, include

from eric.core.rest.routers import get_api_router
from eric.metadata.rest.viewsets import MetadataFieldViewSet, MetadataSearchViewSet

router = get_api_router()
urls = []

# /api/.../metadata -- DISABLED, because unused at the moment
# def add_sub_urls(endpoint, viewset, model_name):
#     router.register(endpoint, viewset, base_name=model_name)
#
#     sub_router = routers.NestedSimpleRouter(router, endpoint, lookup=model_name)
#     sub_router.register(r'metadata', MetadataViewSet, base_name='%s-metadata'.format(model_name))
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
router.register(r'metadatafields', MetadataFieldViewSet, base_name='metadatafield')

# /api/metadata-search
router.register(r'metadata-search', MetadataSearchViewSet, base_name='metadata-search')

urlpatterns = [
    url(r'^', include(urls)),
]
