#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
""" URL Configuration for plugins """
from django.conf.urls import include
from django.urls import re_path

from rest_framework_nested import routers

from eric.core.rest.routers import get_api_router

from eric.projects.rest.viewsets import GenericChangeSetViewSet
from eric.model_privileges.rest.viewsets import ModelPrivilegeViewSet
from eric.relations.rest.viewsets import RelationViewSet
from eric.plugins.rest.viewsets import PluginViewSet, PluginInstanceViewSet

# register REST API Routers
router = get_api_router()

"""
Plugins with history and relations
"""
router.register(r'plugins', PluginViewSet, basename='plugin')

plugin_router = routers.NestedSimpleRouter(router, r'plugins', lookup='plugins')

router.register(r'plugininstances', PluginInstanceViewSet, basename='plugininstance')

plugin_instance_router = routers.NestedSimpleRouter(router, r'plugininstances', lookup='plugininstance')
plugin_instance_router.register(r'relations', RelationViewSet, basename='plugininstance-relation')
plugin_instance_router.register(r'history', GenericChangeSetViewSet, basename='plugininstance-changeset-paginated')
plugin_instance_router.register(r'privileges', ModelPrivilegeViewSet, basename='plugininstance-privileges')

urlpatterns = [
    # REST Endpoints for plugins (history, relations)
    re_path(r'^', include(plugin_router.urls)),
    re_path(r'^', include(plugin_instance_router.urls))
]
