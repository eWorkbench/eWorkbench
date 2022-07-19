#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#

from django.urls import re_path

from eric.cms.rest.viewsets import GetOnlyContentViewSet
from eric.cms.views import ContentView

urlpatterns = [
    # JSON API
    re_path(r'^json/(?P<slug>[-\w]+)/$', GetOnlyContentViewSet.as_view({
        'get': 'retrieve'
    }), name='content-json'),

    # API to get text content directly
    re_path(r'^(?P<slug>[-\w]+)/$', ContentView.as_view(), name='view'),
]
