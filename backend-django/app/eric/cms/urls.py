#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#

from django.urls import re_path

from eric.cms.rest.viewsets import AcceptedScreenViewSet, GetOnlyContentViewSet, GetOnlyLaunchScreenViewSet
from eric.cms.views import ContentView
from eric.core.rest.routers import get_api_router

router = get_api_router()

router.register(r"launchscreens", GetOnlyLaunchScreenViewSet, basename="launchscreen")

router.register(r"acceptedscreens", AcceptedScreenViewSet, basename="acceptedscreen")

urlpatterns = [
    # JSON API
    re_path(r"^json/(?P<slug>[-\w]+)/$", GetOnlyContentViewSet.as_view({"get": "retrieve"}), name="content-json"),
    # API to get text content directly
    re_path(r"^(?P<slug>[-\w]+)/$", ContentView.as_view(), name="view"),
]
