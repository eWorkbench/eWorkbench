#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
""" URL Configuration for versions """
from django.conf.urls import url, include
from rest_framework_nested import routers

from eric.core.rest.routers import get_api_router
from eric.dmp.rest.viewsets import DmpViewSet
from eric.labbooks.rest.viewsets import LabBookViewSet
from eric.pictures.rest.viewsets import PictureViewSet
from eric.shared_elements.rest.viewsets import ContactViewSet, NoteViewSet, TaskViewSet, \
    MeetingViewSet, FileViewSet
from eric.versions.rest.viewsets import VersionViewSet

router = get_api_router()
urls = []


def add_sub_urls(endpoint, viewset, model_name):
    router.register(endpoint, viewset, base_name=model_name)

    sub_router = routers.NestedSimpleRouter(router, endpoint, lookup=model_name)
    sub_router.register(r'versions', VersionViewSet, base_name='%s-version'.format(model_name))

    urls.extend(sub_router.urls)


add_sub_urls(r'contacts', ContactViewSet, 'contact')
add_sub_urls(r'tasks', TaskViewSet, 'task')
add_sub_urls(r'notes', NoteViewSet, 'note')
add_sub_urls(r'meetings', MeetingViewSet, 'meeting')
add_sub_urls(r'pictures', PictureViewSet, 'picture')
add_sub_urls(r'files', FileViewSet, 'file')
add_sub_urls(r'labbooks', LabBookViewSet, 'labbook')
add_sub_urls(r'dmps', DmpViewSet, 'dmp')

urlpatterns = [
    url(r'^', include(urls)),
]
