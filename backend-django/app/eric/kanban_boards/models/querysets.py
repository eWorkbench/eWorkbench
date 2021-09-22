#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import logging

from django.db.models import Q
from django_changeset.models.queryset import ChangeSetQuerySetMixin
from django_userforeignkey.request import get_current_user

from eric.core.models import BaseQuerySet
from eric.projects.models.querysets import BaseProjectEntityPermissionQuerySet, \
    extend_queryset
from eric.shared_elements.models.querysets import TaskQuerySet

logger = logging.getLogger(__name__)


class KanbanBoardQuerySet(BaseProjectEntityPermissionQuerySet, ChangeSetQuerySetMixin):
    def with_columns(self):
        return self.prefetch_related('kanban_board_columns')

    def prefetch_common(self, *args, **kwargs):
        return super(KanbanBoardQuerySet, self).prefetch_common().with_columns()


class KanbanBoardColumnQuerySet(BaseProjectEntityPermissionQuerySet):
    """
    QuerySet for Kanban Board Columns
    The column should inherit permissions from the kanban board
    """

    def viewable(self, *args, **kwargs):
        """
        Returns all element where the related kanban board is viewable
        """
        from eric.kanban_boards.models import KanbanBoard

        return self.filter(kanban_board__pk__in=KanbanBoard.objects.viewable().values_list('pk'))

    def editable(self, *args, **kwargs):
        """
        Returns all element where the related kanban board is editable
        """
        from eric.kanban_boards.models import KanbanBoard

        return self.filter(kanban_board__pk__in=KanbanBoard.objects.editable().values_list('pk'))

    def deletable(self, *args, **kwargs):
        """
        Returns all element where the related kanban board is editable (! editable is used on purpose here)
        """
        from eric.kanban_boards.models import KanbanBoard

        return self.filter(kanban_board__pk__in=KanbanBoard.objects.editable().values_list('pk'))


class KanbanBoardUserFilterSettingQuerySet(BaseQuerySet):
    """
    QuerySet for Kanban Board User Filter Setting.
    The settings should only be for the current user.
    """
    def viewable(self, *args, **kwargs):
        from eric.kanban_boards.models import KanbanBoard
        return self.filter(
            user=get_current_user(),
            kanban_board__pk__in=KanbanBoard.objects.viewable().values_list('pk')
        )

    def editable(self, *args, **kwargs):
        from eric.kanban_boards.models import KanbanBoard
        return self.filter(
            user=get_current_user(),
            kanban_board__pk__in=KanbanBoard.objects.editable().values_list('pk')
        )

    def deletable(self, *args, **kwargs):
        from eric.kanban_boards.models import KanbanBoard
        return self.filter(
            user=get_current_user(),
            kanban_board__pk__in=KanbanBoard.objects.deletable().values_list('pk')
        )


class KanbanBoardUserSettingQuerySet(BaseQuerySet):
    """
    QuerySet for Kanban Board User Setting.
    The settings should only be for the current user.
    """
    def viewable(self, *args, **kwargs):
        from eric.kanban_boards.models import KanbanBoard
        return self.filter(
            user=get_current_user(),
            kanban_board__pk__in=KanbanBoard.objects.viewable().values_list('pk')
        )

    def editable(self, *args, **kwargs):
        from eric.kanban_boards.models import KanbanBoard
        return self.filter(
            user=get_current_user(),
            kanban_board__pk__in=KanbanBoard.objects.editable().values_list('pk')
        )

    def deletable(self, *args, **kwargs):
        from eric.kanban_boards.models import KanbanBoard
        return self.filter(
            user=get_current_user(),
            kanban_board__pk__in=KanbanBoard.objects.deletable().values_list('pk')
        )


class KanbanBoardColumnTaskAssignmentQuerySet(BaseProjectEntityPermissionQuerySet):
    """
    QuerySet for Kanban Board Column Task Assignments
    The task assignment should inherit permissions from the kanban board
    """

    def viewable(self, *args, **kwargs):
        """
        Returns all element where the related kanban board column is viewable
        """
        from eric.kanban_boards.models import KanbanBoard

        return self.filter(kanban_board_column__kanban_board__pk__in=KanbanBoard.objects.viewable().values_list('pk'))

    def editable(self, *args, **kwargs):
        """
        Returns all element where the related kanban board column is editable
        """
        from eric.kanban_boards.models import KanbanBoard

        return self.filter(kanban_board_column__kanban_board__pk__in=KanbanBoard.objects.editable().values_list('pk'))

    def deletable(self, *args, **kwargs):
        """
        Returns all element where the related kanban board is editable (! editable is used on purpose here)
        """
        return self.editable(*args, **kwargs)


@extend_queryset(TaskQuerySet)
class ExtendedKanbanBoardTaskQuerySet:
    """
    Extending the Task QuerySet for Kanban Boards
    If a Task is in a Kanban Board, users are allowed to view it if they are allowed to view the kanban board
    """
    @staticmethod
    def _viewable():
        """
        Extend NoteQuerySet such that it allows viewing of Notes that are assigned in a Labbook where the current
        user is allowed to view the LabBook
        :return: django.db.models.Q
        """
        from eric.kanban_boards.models import KanbanBoardColumnTaskAssignment

        # get all viewable LabBookChildElements that contain a note
        task_pks = KanbanBoardColumnTaskAssignment.objects.viewable().values_list('task__id')

        # return Task.filter(pk__in=task_pks)
        return Q(
            pk__in=task_pks
        )
