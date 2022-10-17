#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from eric.core.rest.filters import (
    BaseFilter,
    BetterBooleanFilter,
    BooleanDefaultFilter,
    ListFilter,
    RecursiveProjectsListFilter,
    WorkbenchElementFilter,
)
from eric.labbooks.models import LabBook, LabbookSection


class LabBookFilter(WorkbenchElementFilter):
    """Filter for LabBook, which allows filtering for the project (foreign key)"""

    class Meta:
        model = LabBook
        fields = {
            "projects": BaseFilter.FOREIGNKEY_COMPERATORS,
            "created_by": BaseFilter.FOREIGNKEY_COMPERATORS,
        }

    is_template = BetterBooleanFilter()
    projects_recursive = RecursiveProjectsListFilter(field_name="projects")


class LabbookSectionFilter(BaseFilter):
    """Filter for LabBook sections"""

    class Meta:
        model = LabbookSection
        fields = {
            "date": BaseFilter.DATE_COMPERATORS,
            "child_elements": BaseFilter.FOREIGNKEY_COMPERATORS,
            "created_by": BaseFilter.FOREIGNKEY_COMPERATORS,
        }

    child_elements = ListFilter(field_name="child_elements")
    deleted = BooleanDefaultFilter()
    projects = ListFilter(field_name="projects")
