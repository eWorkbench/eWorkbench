#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import django_filters

from eric.core.rest.filters import BaseFilter, BooleanDefaultFilter, RecursiveProjectsListFilter
from eric.core.rest.filters import ListFilter, RecentlyModifiedByMeFilter

from eric.plugins.models.models import Plugin, PluginInstance


class PluginFilter(BaseFilter):
    """ Filter for Plugins, which allows filtering for title """
    class Meta:
        model = Plugin
        fields = {
            'title'
        }

    recently_modified_by_me = RecentlyModifiedByMeFilter()


class PluginInstanceFilter(BaseFilter):
    """ Filter for Plugin Instances, which allows filtering for the project (foreign key) """
    class Meta:
        model = PluginInstance
        fields = {
            'projects': BaseFilter.FOREIGNKEY_COMPERATORS,
            'projects_recursive': BaseFilter.FOREIGNKEY_COMPERATORS,
            'created_by': BaseFilter.FOREIGNKEY_COMPERATORS,
        }

    deleted = BooleanDefaultFilter()

    projects = ListFilter(field_name='project')

    projects_recursive = RecursiveProjectsListFilter(field_name='projects')

    plugin = django_filters.ModelChoiceFilter(field_name='plugin', queryset=Plugin.objects.all())

    recently_modified_by_me = RecentlyModifiedByMeFilter()
