#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from eric.core.models import BaseManager
from eric.kanban_boards.models.querysets import KanbanBoardQuerySet, KanbanBoardColumnQuerySet, \
    KanbanBoardColumnTaskAssignmentQuerySet

KanbanBoardManager = BaseManager.from_queryset(KanbanBoardQuerySet)
KanbanBoardColumnManager = BaseManager.from_queryset(KanbanBoardColumnQuerySet)
KanbanBoardColumnTaskAssignmentManager = BaseManager.from_queryset(KanbanBoardColumnTaskAssignmentQuerySet)
