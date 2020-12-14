#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#

from django.conf.urls import url, include
from rest_framework_nested import routers

from eric.core.rest.routers import get_api_router

from eric.favourites.rest.viewsets import FavouritesViewSet

router = get_api_router()

router.register(r'favourites', FavouritesViewSet, basename='favourite')

urlpatterns = [
]
