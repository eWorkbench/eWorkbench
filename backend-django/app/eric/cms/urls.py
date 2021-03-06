#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#

from django.conf.urls import url

from eric.cms.rest.viewsets import GetOnlyContentViewSet
from eric.cms.views import ContentView

urlpatterns = [
    # JSON API
    url(r'^json/(?P<slug>[-\w]+)/$', GetOnlyContentViewSet.as_view({
        'get': 'retrieve'
    }), name='content-json'),

    # API to get text content directly
    url(r'^(?P<slug>[-\w]+)/$', ContentView.as_view(), name='view'),
]
