#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import os
import logging

from django.core.exceptions import ValidationError, PermissionDenied
from django.db.models.signals import pre_delete, pre_save, post_delete, post_save
from django.dispatch import receiver
from django.utils.translation import ugettext_lazy as _

from eric.core.models import disable_permission_checks
from eric.projects.models.handlers import check_create_roles_for_other_workbench_elements
from eric.shared_elements.models import Task
from eric.kanban_boards.models.models import KanbanBoard, KanbanBoardColumn, KanbanBoardColumnTaskAssignment

logger = logging.getLogger(__name__)


@receiver(post_delete, sender=KanbanBoard)
def delete_kanban_board_column_on_delete_kanban_board(instance, *args, **kwargs):
    """
    On delete of a kanban board, we need to delete the columns too

    The `KanbanBoard` model has `on_delete=models.SET_NULL`
    This means we can safely delete all columns that have kanban_board = NULL
    :param instance:
    :param args:
    :param kwargs:
    :return:
    """
    # if the user was allowed to delete the kanban board, the user is also allowed to delete the kanban board columns
    # and the kanban board column task assignments
    with disable_permission_checks(KanbanBoardColumn):
        with disable_permission_checks(KanbanBoardColumnTaskAssignment):
            KanbanBoardColumn.objects.filter(kanban_board__isnull=True).delete()


@receiver(check_create_roles_for_other_workbench_elements)
def check_create_roles_for_kanbanboard_column(user, sender, instance, *args, **kwargs):
    """
    Checks if the current user is allowed to create something that is related to a kanban board column (e.g., adding
    a task to a column)

    This is a sub-method called by `check_create_roles` (via the signal
    `check_create_roles_for_other_workbench_elements`) if `instance` is related to a `KanbanBoardColumn`
    :param user:
    :param sender:
    :param instance:
    :param args:
    :param kwargs:
    :return:
    """
    if not hasattr(instance, 'kanban_board_column'):
        # not related to a kanban board column
        return

    # check if the kanban board column is editable (if not, it's just not allowed)
    if not instance.kanban_board_column.is_editable():
        raise PermissionDenied


@receiver(check_create_roles_for_other_workbench_elements)
def check_create_roles_for_kanbanboard(user, sender, instance, *args, **kwargs):
    """
    Checks if the current user is allowed to create something that is related to a kanban board (e.g., adding a column
    to the kanban board)

    This is a sub-method called by `check_create_roles` (via the signal
    `check_create_roles_for_other_workbench_elements`) if `instance` is related to a `KanbanBoard`
    :param user:
    :param sender:
    :param instance:
    :param args:
    :param kwargs:
    :return:
    """
    if not hasattr(instance, 'kanban_board'):
        # not related to a kanban board
        return

    # check if the kanban board is editable (if not, it's just not allowed)
    if not instance.kanban_board.is_editable():
        raise PermissionDenied
