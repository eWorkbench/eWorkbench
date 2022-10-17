#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from eric.core.rest.filters import BaseFilter, RecursiveProjectsListFilter, WorkbenchElementFilter
from eric.pictures.models import Picture


class PictureFilter(WorkbenchElementFilter):
    """Filter for Tasks, which allows filtering for the project (foreign key)"""

    class Meta:
        model = Picture
        fields = {
            "projects": BaseFilter.FOREIGNKEY_COMPERATORS,
            "created_by": BaseFilter.FOREIGNKEY_COMPERATORS,
        }

    projects_recursive = RecursiveProjectsListFilter(field_name="projects")
