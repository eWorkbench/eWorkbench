#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
""" defines custom permission settings for the REST API """
from rest_framework import permissions

from eric.plugins.models import Plugin, PluginInstance


class HasPluginAccess(permissions.BasePermission):
    """
    Custom permission to only allow to create a plugin instance if the referenced plugin is accessible for this user
    """

    def has_object_permission(self, request, view, obj):
        """ returns True when the request method is in SAFE_METHODS (e.g., GET, HEAD, OPTIONS),
        otherwise the request.user has to have access to the referenced plugin"""
        # allow GET / HEAD / OPTIONS
        if request.method in permissions.SAFE_METHODS:
            return True

        # make sure we check for permissions to Plugin, not Plugin Instance
        if obj.get_content_type() == PluginInstance.get_content_type():
            obj = Plugin.objects.get(pk=obj.plugin.pk)

        # Write permissions only if the user has access to the referenced plugin
        accessible_plugins = Plugin.objects.viewable()
        if obj in accessible_plugins:
            return True
        else:
            return False
