#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
from eric.kanban_boards.models import KanbanBoard
from eric.model_privileges.models import ModelPrivilege
from eric.model_privileges.utils import (
    BasePrivilege,
    UserPermission,
    get_model_privileges_and_project_permissions_for,
    register_privilege,
)
from eric.shared_elements.models import Task


@register_privilege(Task, execution_order=999)
class KanbanBoardTaskPrivilege(BasePrivilege):
    """
    If a user can view a kanban board, the user can also view all tasks that are in the columns of the kanban board
    """

    @staticmethod
    def get_privileges(obj, permissions_by_user=None):
        permissions_by_user = permissions_by_user or dict()
        # get all kanban boards where the task is assigned to a column
        kanban_boards = KanbanBoard.objects.filter(kanban_board_columns__kanban_board_column_task_assignments__task=obj)

        # iterate over all kanban boards where the task is assigned to a column
        for kanban_board in kanban_boards:
            kanban_board_privileges = get_model_privileges_and_project_permissions_for(KanbanBoard, kanban_board)

            # iterate over all privileges
            for priv in kanban_board_privileges:
                # check if view privilege is set
                if priv.view_privilege == ModelPrivilege.ALLOW or priv.full_access_privilege == ModelPrivilege.ALLOW:
                    user = priv.user

                    if user.pk in permissions_by_user:
                        permissions_by_user[user.pk].view_privilege = ModelPrivilege.ALLOW
                    else:
                        # add user to permissions by user
                        permissions_by_user[user.pk] = UserPermission(
                            user, obj.pk, obj.get_content_type(), can_view=True
                        )

        return permissions_by_user
