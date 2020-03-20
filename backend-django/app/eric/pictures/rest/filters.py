#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from eric.core.rest.filters import BaseFilter, BooleanDefaultFilter
from eric.core.rest.filters import ListFilter, RecursiveProjectsListFilter, RecentlyModifiedByMeFilter

from eric.pictures.models import Picture


class PictureFilter(BaseFilter):
    """ Filter for Tasks, which allows filtering for the project (foreign key) """
    class Meta:
        model = Picture
        fields = {
            'projects': BaseFilter.FOREIGNKEY_COMPERATORS,
            'projects_recursive': BaseFilter.FOREIGNKEY_COMPERATORS,
            'created_by': BaseFilter.FOREIGNKEY_COMPERATORS,
        }

    deleted = BooleanDefaultFilter()

    projects = ListFilter(name='projects')

    projects_recursive = RecursiveProjectsListFilter(name='projects')

    recently_modified_by_me = RecentlyModifiedByMeFilter()
