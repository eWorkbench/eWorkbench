#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from eric.core.models import BaseManager
from eric.kanban_boards.models.querysets import (
    KanbanBoardColumnQuerySet,
    KanbanBoardColumnTaskAssignmentQuerySet,
    KanbanBoardQuerySet,
    KanbanBoardUserFilterSettingQuerySet,
    KanbanBoardUserSettingQuerySet,
)

KanbanBoardManager = BaseManager.from_queryset(KanbanBoardQuerySet)
KanbanBoardColumnManager = BaseManager.from_queryset(KanbanBoardColumnQuerySet)
KanbanBoardColumnTaskAssignmentManager = BaseManager.from_queryset(KanbanBoardColumnTaskAssignmentQuerySet)
KanbanBoardUserFilterSettingManager = BaseManager.from_queryset(KanbanBoardUserFilterSettingQuerySet)
KanbanBoardUserSettingManager = BaseManager.from_queryset(KanbanBoardUserSettingQuerySet)
