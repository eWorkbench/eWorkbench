#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import django_filters

from eric.core.rest.filters import (
    BaseFilter,
    BooleanDefaultFilter,
    ListFilter,
    RecentlyModifiedByMeFilter,
    RecursiveProjectsListFilter,
    WorkbenchElementFilter,
)
from eric.plugins.models.models import Plugin, PluginInstance


class PluginFilter(BaseFilter):
    """Filter for Plugins, which allows filtering for title"""

    class Meta:
        model = Plugin
        fields = {"title"}

    recently_modified_by_me = RecentlyModifiedByMeFilter()


class PluginInstanceFilter(WorkbenchElementFilter):
    """Filter for Plugin Instances, which allows filtering for the project (foreign key)"""

    class Meta:
        model = PluginInstance
        fields = {
            "projects": BaseFilter.FOREIGNKEY_COMPERATORS,
            "created_by": BaseFilter.FOREIGNKEY_COMPERATORS,
        }

    plugin = django_filters.ModelChoiceFilter(field_name="plugin", queryset=Plugin.objects.all())
    projects_recursive = RecursiveProjectsListFilter(field_name="projects")
