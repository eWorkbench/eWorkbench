#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from django.conf.urls import include
from django.urls import re_path

from rest_framework_nested import routers

from eric.core.rest.routers import get_api_router

from eric.sortable_menu.rest.viewsets import MenuEntryViewSet, MenuEntryParameterViewSet


router = get_api_router()

# register menu entries
router.register(r'menu_entries', MenuEntryViewSet, 'menuentry')

# create a nested router
menu_entries_router = routers.NestedSimpleRouter(router, r'menu_entries', lookup='menu_entry')
# register menu_entry_parameters as a subroute of menu_entries
menu_entries_router.register(r'menu_entry_parameters', MenuEntryParameterViewSet, basename='menu_entry_parameters')

urlpatterns = [
    re_path(r'^', include(menu_entries_router.urls))
]
