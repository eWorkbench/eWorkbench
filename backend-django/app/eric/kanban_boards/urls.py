#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
""" URL Configuration for kanban boards """
from django.conf.urls import include
from django.urls import re_path

from rest_framework_nested import routers

from eric.core.rest.routers import get_api_router
from eric.kanban_boards.rest.viewsets import (
    KanbanBoardColumnTaskAssignmentViewSet,
    KanbanBoardUserFilterSettingViewSet,
    KanbanBoardUserSettingViewSet,
    KanbanBoardViewSet,
    TaskKanbanBoardAssignmentsViewSet,
)
from eric.model_privileges.rest.viewsets import ModelPrivilegeViewSet
from eric.projects.rest.viewsets import GenericChangeSetViewSet

# relations
from eric.relations.rest.viewsets import RelationViewSet

# register REST API Routers
router = get_api_router()


"""
Kanban Boards
with history and relations
"""
router.register(r"kanbanboards", KanbanBoardViewSet, basename="kanbanboard")

kanban_board_router = routers.NestedSimpleRouter(router, r"kanbanboards", lookup="kanbanboard")
kanban_board_router.register(r"relations", RelationViewSet, basename="kanbanboard-relation")
kanban_board_router.register(r"history", GenericChangeSetViewSet, basename="kanbanboard-changeset-paginated")
kanban_board_router.register(r"privileges", ModelPrivilegeViewSet, basename="kanbanboard-privileges")
kanban_board_router.register(
    r"filtersettings", KanbanBoardUserFilterSettingViewSet, basename="kanbanboard-filtersettings"
)
kanban_board_router.register(r"usersettings", KanbanBoardUserSettingViewSet, basename="kanbanboard-usersettings")

# register sub view for assigned tasks
kanban_board_router.register(r"tasks", KanbanBoardColumnTaskAssignmentViewSet, basename="kanbanboard-tasks")

# register sub view for tasks, which list all assignments of a task
tasks_router = routers.NestedSimpleRouter(router, r"tasks", lookup="task")
tasks_router.register(
    r"kanbanboard_assignments", TaskKanbanBoardAssignmentsViewSet, basename="task-kanbanboard-assignments"
)


urlpatterns = [
    # REST Endpoints for kanban boards (history, relations)
    re_path(r"^", include(kanban_board_router.urls)),
    re_path(r"^", include(tasks_router.urls)),
]
