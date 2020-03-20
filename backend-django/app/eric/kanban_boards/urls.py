#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
""" URL Configuration for kanban boards """
from django.conf.urls import url, include

from rest_framework_nested import routers

from eric.core.rest.routers import get_api_router

from eric.projects.rest.viewsets import GenericChangeSetViewSet
from eric.model_privileges.rest.viewsets import ModelPrivilegeViewSet

# relations
from eric.relations.rest.viewsets import RelationViewSet

from eric.kanban_boards.rest.viewsets import KanbanBoardViewSet, KanbanBoardColumnTaskAssignmentViewSet, \
    TaskKanbanBoardAssignmentsViewSet

# register REST API Routers
router = get_api_router()


"""
Kanban Boards
with history and relations
"""
router.register(r'kanbanboards', KanbanBoardViewSet, base_name='kanbanboard')

kanban_board_router = routers.NestedSimpleRouter(router, r'kanbanboards', lookup='kanbanboard')
kanban_board_router.register(r'relations', RelationViewSet, base_name='kanbanboard-relation')
kanban_board_router.register(r'history', GenericChangeSetViewSet,
                             base_name='kanbanboard-changeset-paginated')
kanban_board_router.register(r'privileges', ModelPrivilegeViewSet, base_name='kanbanboard-privileges')

# register sub view for assigned tasks
kanban_board_router.register(r'tasks', KanbanBoardColumnTaskAssignmentViewSet, base_name='kanbanboard-tasks')

# register sub view for tasks, which list all assignments of a task
tasks_router = routers.NestedSimpleRouter(router, r'tasks', lookup='task')
tasks_router.register(r'kanbanboard_assignments', TaskKanbanBoardAssignmentsViewSet,
                      base_name='task-kanbanboard-assignments')


urlpatterns = [
    # REST Endpoints for kanban boards (history, relations)
    url(r'^', include(kanban_board_router.urls)),
    url(r'^', include(tasks_router.urls)),
]
