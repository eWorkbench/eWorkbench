#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from eric.core.rest.filters import BaseFilter, WorkbenchElementFilter, RecursiveProjectsListFilter
from eric.kanban_boards.models import KanbanBoard


class KanbanBoardFilter(WorkbenchElementFilter):
    class Meta:
        model = KanbanBoard
        fields = {
            'projects': BaseFilter.FOREIGNKEY_COMPERATORS,
            'created_by': BaseFilter.FOREIGNKEY_COMPERATORS,
        }

    projects_recursive = RecursiveProjectsListFilter(field_name='projects')
