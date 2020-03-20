#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from eric.core.rest.filters import BaseFilter, BooleanDefaultFilter, BetterBooleanFilter
from eric.core.rest.filters import ListFilter, RecursiveProjectsListFilter, RecentlyModifiedByMeFilter

from eric.labbooks.models import LabBook, LabbookSection


class LabBookFilter(BaseFilter):
    """ Filter for LabBook, which allows filtering for the project (foreign key) """
    class Meta:
        model = LabBook
        fields = {
            'projects': BaseFilter.FOREIGNKEY_COMPERATORS,
            'projects_recursive': BaseFilter.FOREIGNKEY_COMPERATORS,
            'created_by': BaseFilter.FOREIGNKEY_COMPERATORS,
        }

    is_template = BetterBooleanFilter()

    deleted = BooleanDefaultFilter()

    projects = ListFilter(name='projects')

    projects_recursive = RecursiveProjectsListFilter(name='projects')

    recently_modified_by_me = RecentlyModifiedByMeFilter()


class LabbookSectionFilter(BaseFilter):
    """ Filter for LabBook sections """
    class Meta:
        model = LabbookSection
        fields = {
            'date': BaseFilter.DATE_COMPERATORS,
            'child_elements': BaseFilter.FOREIGNKEY_COMPERATORS,
            'created_by': BaseFilter.FOREIGNKEY_COMPERATORS,
        }

    child_elements = ListFilter(name='child_elements')

    deleted = BooleanDefaultFilter()

    projects = ListFilter(name='projects')
