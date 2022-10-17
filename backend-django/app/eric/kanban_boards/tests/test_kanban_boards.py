#
# Copyright (C) 2016-present TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import json
from datetime import datetime, timedelta

from rest_framework import status
from rest_framework.test import APITestCase

from eric.core.tests import test_utils
from eric.kanban_boards.models import KanbanBoard, KanbanBoardColumnTaskAssignment
from eric.kanban_boards.tests.core import KanbanBoardClient, KanbanBoardMixin
from eric.model_privileges.models import ModelPrivilege
from eric.projects.tests.mixin_entity_generic_tests import EntityChangeRelatedProjectTestMixin
from eric.shared_elements.models import Task
from eric.shared_elements.tests.core import TaskMixin

HTTP_USER_AGENT = "APITestClient"
REMOTE_ADDR = "127.0.0.1"


class TestGenericsKanbanBoards(APITestCase, EntityChangeRelatedProjectTestMixin, KanbanBoardMixin, TaskMixin):
    entity = KanbanBoard

    def setUp(self):
        self.superSetUp()

        self.data = [
            {
                "title": "Super Important Project 1",
                "project_pks": None,
                "kanban_board_columns": [],
            },
            {
                "title": "Private Kanban Board",
                "project_pks": None,
                "kanban_board_columns": [],
            },
        ]

    def test_check_auto_created_kanban_board_column_attributes(self):
        """Test creating a kanban board and check if all auto generated columns exists and are correct"""

        # create a new kanban board
        response = self.rest_create_kanbanboard(self.token1, self.project1.pk, "test 1", HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        decoded = json.loads(response.content.decode())
        kanban_board_columns = decoded["kanban_board_columns"]

        # check if 3 columns are auto-generated
        self.assertEqual(len(kanban_board_columns), 1, msg="1 column should be created automatically")

        # check if the columns have the correct ordering and task state
        i = 0
        for kanban_board_column in kanban_board_columns:
            self.assertEqual(kanban_board_column["ordering"], i, msg="The column should have the correct ordering id =")
            i = i + 1

    def test_add_kanban_board_column(self):
        """Tests for adding a new kanban board column"""

        # create a new kanban board
        response = self.rest_create_kanbanboard(self.token1, self.project1.pk, "test 1", HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        decoded = json.loads(response.content.decode())
        kanban_board_pk = decoded["pk"]
        kanban_board_columns = decoded["kanban_board_columns"]

        # add a new kanban board column
        new_column = {"title": "New column", "icon": "", "ordering": 1, "color": "rgba(224,224,224,0.65)"}
        kanban_board_columns.append(new_column)

        response = self.rest_update_kanbanboard_child_elements(
            self.token1, kanban_board_pk, kanban_board_columns, HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        decoded = json.loads(response.content.decode())
        kanban_board_columns = decoded["kanban_board_columns"]
        # check if now 4 columns exist
        self.assertEqual(len(kanban_board_columns), 2, msg="2 columns should now exists")

        # check if the new column has the correct data
        self.assertEqual(kanban_board_columns[1]["title"], "New column", msg="new column should have the expected name")
        self.assertEqual(kanban_board_columns[1]["ordering"], 1, msg="new column should have the expected ordering")

    def test_change_kanban_board_column_attributes(self):
        """Tests for changing kanban board columns"""

        # create a new kanban board
        response = self.rest_create_kanbanboard(self.token1, self.project1.pk, "test 1", HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        decoded = json.loads(response.content.decode())
        kanban_board_pk = decoded["pk"]
        kanban_board_columns = decoded["kanban_board_columns"]

        kanban_board = json.loads(response.content.decode())

        # create two more columns (in progress and done)
        kanban_board_columns = kanban_board["kanban_board_columns"]

        # add a new kanban board column
        new_column = {"title": "In Progress", "icon": "", "ordering": 1, "color": "rgba(224,224,224,0.65)"}
        kanban_board_columns.append(new_column)

        new_column = {"title": "Done", "icon": "", "ordering": 2, "color": "rgba(112,112,112,0.65)"}
        kanban_board_columns.append(new_column)

        response = self.rest_update_kanbanboard_child_elements(
            self.token1, kanban_board["pk"], kanban_board_columns, HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        kanban_board_columns = json.loads(response.content.decode())["kanban_board_columns"]

        # cache auto generated columns
        cached_auto_generated_column_new = kanban_board_columns[0]
        cached_auto_generated_column_prog = kanban_board_columns[1]
        cached_auto_generated_column_done = kanban_board_columns[2]

        # add a new (fourth) kanban board column
        new_column = {"title": "New column", "icon": "", "ordering": 3, "color": "rgba(224,224,224,0.65)"}
        kanban_board_columns.append(new_column)

        response = self.rest_update_kanbanboard_child_elements(
            self.token1, kanban_board_pk, kanban_board_columns, HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        decoded = json.loads(response.content.decode())
        kanban_board_columns = decoded["kanban_board_columns"]

        # cache new created column
        cached_new_column = kanban_board_columns[3]

        # change title and task state of the new kanban board column
        kanban_board_columns[3]["title"] = "Changed column name"

        response = self.rest_update_kanbanboard_child_elements(
            self.token1, kanban_board_pk, kanban_board_columns, HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        decoded = json.loads(response.content.decode())
        kanban_board_columns = decoded["kanban_board_columns"]

        # check if the changed column has the correct data
        self.assertEqual(
            kanban_board_columns[3]["title"], "Changed column name", msg="changed column should have the expected name"
        )

        # cache changed column - overrite existing cached column
        cached_new_column = kanban_board_columns[3]

        # check that the column was not changed
        response = self.rest_get_kanbanboard(self.token1, kanban_board_pk, HTTP_USER_AGENT, REMOTE_ADDR)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        decoded = json.loads(response.content.decode())
        kanban_board_columns = decoded["kanban_board_columns"]

        # change ordering of the new kanban board column
        kanban_board_columns[3]["ordering"] = 1

        # ordering id has to be unique so the ordering of the other columns has to change
        kanban_board_columns[1]["ordering"] = 2  # change ordering from 2 to 3
        kanban_board_columns[2]["ordering"] = 3  # change ordering from 3 to 4

        response = self.rest_update_kanbanboard_child_elements(
            self.token1, kanban_board_pk, kanban_board_columns, HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        decoded = json.loads(response.content.decode())
        kanban_board_columns = decoded["kanban_board_columns"]

        # response is always sorted after ordering
        # so check if the columns are in the correct order after changing the 'ordering' field

        # first column: Title: New, Task state: NEW
        self.assertEqual(
            kanban_board_columns[0]["title"],
            cached_auto_generated_column_new["title"],
            msg="column should have the expected name",
        )
        self.assertEqual(kanban_board_columns[0]["ordering"], 0, msg="changed column should have the expected ordering")

        # second column: Title: Changed column name, Task state: DONE
        self.assertEqual(
            kanban_board_columns[1]["title"], cached_new_column["title"], msg="column should have the expected name"
        )
        self.assertEqual(kanban_board_columns[1]["ordering"], 1, msg="changed column should have the expected ordering")

        # second column: Title: In Progress, Task state: PROG
        self.assertEqual(
            kanban_board_columns[2]["title"],
            cached_auto_generated_column_prog["title"],
            msg="column should have the expected name",
        )
        self.assertEqual(kanban_board_columns[2]["ordering"], 2, msg="changed column should have the expected ordering")

        # second column: Title: Done, Task state: DONE
        self.assertEqual(
            kanban_board_columns[3]["title"],
            cached_auto_generated_column_done["title"],
            msg="column should have the expected name",
        )
        self.assertEqual(kanban_board_columns[3]["ordering"], 3, msg="changed column should have the expected ordering")

    def test_delete_kanban_board_columns(self):
        """Tests for deleting kanban board columns"""

        # create a new kanban board
        response = self.rest_create_kanbanboard(self.token1, self.project1.pk, "test 1", HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        decoded = json.loads(response.content.decode())
        kanban_board_pk = decoded["pk"]
        kanban_board_columns = decoded["kanban_board_columns"]

        kanban_board = json.loads(response.content.decode())

        # create two more columns (in progress and done)
        kanban_board_columns = kanban_board["kanban_board_columns"]

        # add a new kanban board column
        new_column = {"title": "In Progress", "icon": "", "ordering": 1, "color": "rgba(224,224,224,0.65)"}
        kanban_board_columns.append(new_column)

        new_column = {"title": "Done", "icon": "", "ordering": 2, "color": "rgba(112,112,112,0.65)"}
        kanban_board_columns.append(new_column)

        response = self.rest_update_kanbanboard_child_elements(
            self.token1, kanban_board["pk"], kanban_board_columns, HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        kanban_board_columns = json.loads(response.content.decode())["kanban_board_columns"]

        # add new kanban board columns
        new_column_state_new = {"title": "New column NEW", "icon": "", "ordering": 4, "color": "rgba(224,224,224,0.65)"}
        new_column_state_prog = {
            "title": "New column PROG",
            "icon": "",
            "ordering": 5,
            "color": "rgba(224,224,224,0.65)",
        }
        kanban_board_columns.append(new_column_state_new)
        kanban_board_columns.append(new_column_state_prog)

        response = self.rest_update_kanbanboard_child_elements(
            self.token1, kanban_board_pk, kanban_board_columns, HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        decoded = json.loads(response.content.decode())
        kanban_board_columns = decoded["kanban_board_columns"]

        # delete the new created column 'New column NEW' and the auto generated column 'In Progress'
        del kanban_board_columns[1]
        del kanban_board_columns[3]

        response = self.rest_update_kanbanboard_child_elements(
            self.token1, kanban_board_pk, kanban_board_columns, HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        decoded = json.loads(response.content.decode())
        kanban_board_columns = decoded["kanban_board_columns"]

        # check if now 3 columns are available
        self.assertEqual(len(kanban_board_columns), 3, msg="3 columns should now exists")

    def test_delete_kanban_board_with_column_and_task(self):
        """Tests for deleting kanban board when it has a column and a task"""
        # create a new kanban board
        response = self.rest_create_kanbanboard(self.token1, self.project1.pk, "test 1", HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        kanban_board = json.loads(response.content.decode())

        # create two more columns (in progress and done)
        kanban_board_columns = kanban_board["kanban_board_columns"]

        # add a new kanban board column
        new_column = {"title": "In Progress", "icon": "", "ordering": 1, "color": "rgba(224,224,224,0.65)"}
        kanban_board_columns.append(new_column)

        response = self.rest_update_kanbanboard_child_elements(
            self.token1, kanban_board["pk"], kanban_board_columns, HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        kanban_board_columns = json.loads(response.content.decode())

        decoded = json.loads(response.content.decode())
        kanban_board_pk = decoded["pk"]
        kanban_board_columns = decoded["kanban_board_columns"]
        kanban_board_column_new_pk = kanban_board_columns[0]["pk"]

        # create some tasks
        response = self.rest_create_task(
            self.token1,
            self.project1.pk,
            "New Task 1",
            "Description...",
            Task.TASK_STATE_NEW,
            Task.TASK_PRIORITY_HIGH,
            datetime.now(),
            datetime.now() + timedelta(days=30),
            self.user1.pk,
            HTTP_USER_AGENT,
            REMOTE_ADDR,
        )
        decoded = json.loads(response.content.decode())
        task1_pk = decoded["pk"]

        # add one task to kanban column
        response = self.rest_add_task_to_kanbanboard_column(
            self.token1, kanban_board_pk, kanban_board_column_new_pk, task1_pk, HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        decoded = json.loads(response.content.decode())

        # check if task was added to kanban column
        self.assertEqual(
            decoded["kanban_board_column"], kanban_board_column_new_pk, msg="Check if the task is in the correct column"
        )

        # needs to be trashed first
        response = self.rest_trash_kanbanboard(self.token1, kanban_board_pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # The KanbanBoard should still be there
        self.assertEqual(KanbanBoard.objects.all().count(), 1)

        # delete kanban board (must be done by a superuser)
        response = self.rest_delete_kanbanboard(self.superuser_token, kanban_board_pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        # The KanbanBoard should now be deleted
        self.assertEqual(KanbanBoard.objects.all().count(), 0)

    def test_add_tasks_to_kanban_board_columns(self):
        """Tests for adding tasks into the kanban columns"""

        # create a new kanban board
        response = self.rest_create_kanbanboard(self.token1, self.project1.pk, "test 1", HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        kanban_board = json.loads(response.content.decode())

        # create two more columns (in progress and done)
        kanban_board_columns = kanban_board["kanban_board_columns"]

        # add a new kanban board column
        new_column = {"title": "In Progress", "icon": "", "ordering": 1, "color": "rgba(224,224,224,0.65)"}
        kanban_board_columns.append(new_column)

        new_column = {"title": "Done", "icon": "", "ordering": 2, "color": "rgba(112,112,112,0.65)"}
        kanban_board_columns.append(new_column)

        response = self.rest_update_kanbanboard_child_elements(
            self.token1, kanban_board["pk"], kanban_board_columns, HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        kanban_board_columns = json.loads(response.content.decode())

        decoded = json.loads(response.content.decode())
        kanban_board_pk = decoded["pk"]
        kanban_board_columns = decoded["kanban_board_columns"]
        kanban_board_column_new_pk = kanban_board_columns[0]["pk"]
        kanban_board_column_prog_pk = kanban_board_columns[1]["pk"]
        kanban_board_column_done_pk = kanban_board_columns[2]["pk"]

        # create some tasks
        response = self.rest_create_task(
            self.token1,
            self.project1.pk,
            "New Task 1",
            "Description...",
            Task.TASK_STATE_NEW,
            Task.TASK_PRIORITY_HIGH,
            datetime.now(),
            datetime.now() + timedelta(days=30),
            self.user1.pk,
            HTTP_USER_AGENT,
            REMOTE_ADDR,
        )
        decoded = json.loads(response.content.decode())
        task1_pk = decoded["pk"]
        response = self.rest_create_task(
            self.token1,
            self.project1.pk,
            "New Task 2",
            "Description...",
            Task.TASK_STATE_PROGRESS,
            Task.TASK_PRIORITY_HIGH,
            datetime.now(),
            datetime.now() + timedelta(days=30),
            self.user1.pk,
            HTTP_USER_AGENT,
            REMOTE_ADDR,
        )
        decoded = json.loads(response.content.decode())
        task2_pk = decoded["pk"]
        response = self.rest_create_task(
            self.token1,
            self.project1.pk,
            "New Task 3",
            "Description...",
            Task.TASK_STATE_NEW,
            Task.TASK_PRIORITY_HIGH,
            datetime.now(),
            datetime.now() + timedelta(days=30),
            self.user1.pk,
            HTTP_USER_AGENT,
            REMOTE_ADDR,
        )
        decoded = json.loads(response.content.decode())
        task3_pk = decoded["pk"]
        response = self.rest_create_task(
            self.token1,
            self.project1.pk,
            "New Task 4",
            "Description...",
            Task.TASK_STATE_DONE,
            Task.TASK_PRIORITY_HIGH,
            datetime.now(),
            datetime.now() + timedelta(days=30),
            self.user1.pk,
            HTTP_USER_AGENT,
            REMOTE_ADDR,
        )
        decoded = json.loads(response.content.decode())
        task4_pk = decoded["pk"]
        response = self.rest_create_task(
            self.token1,
            self.project1.pk,
            "New Task 5",
            "Description...",
            Task.TASK_STATE_DONE,
            Task.TASK_PRIORITY_HIGH,
            datetime.now(),
            datetime.now() + timedelta(days=30),
            self.user1.pk,
            HTTP_USER_AGENT,
            REMOTE_ADDR,
        )
        decoded = json.loads(response.content.decode())
        task5_pk = decoded["pk"]

        # add one task to kanban column
        response = self.rest_add_task_to_kanbanboard_column(
            self.token1, kanban_board_pk, kanban_board_column_new_pk, task1_pk, HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        decoded = json.loads(response.content.decode())

        # check if task was added to kanban column
        self.assertEqual(
            decoded["kanban_board_column"], kanban_board_column_new_pk, msg="Check if the task is in the correct column"
        )

        # add more than one task to kanban column and the result should be like
        # column with task_state NEW
        #   Task 1
        #   Task 2
        # column with task_state PROG
        #   Task 3
        # column with task_state DONE
        #   Task 4
        #   Task 5
        data = [
            {"kanban_board_column": kanban_board_column_new_pk, "task_id": task2_pk},
            {"kanban_board_column": kanban_board_column_prog_pk, "task_id": task3_pk},
            {"kanban_board_column": kanban_board_column_done_pk, "task_id": task4_pk},
            {"kanban_board_column": kanban_board_column_done_pk, "task_id": task5_pk},
        ]

        response = self.rest_add_tasks_to_kanbanboard_column(
            self.token1, kanban_board_pk, data, HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        decoded = json.loads(response.content.decode())

        # check if tasks were added to kanban columns
        self.assertEqual(len(decoded), 5, msg="The kanban board should have 5 tasks")

        # check if ordering of the tasks inside each column is correct
        # the response is sorted after the ordering of the tasks so first comes all tasks with ordering 0, than 1, ...
        self.assertEqual(decoded[0]["ordering"], 0, msg="Task ordering has to be 0")
        self.assertEqual(decoded[1]["ordering"], 1, msg="Task ordering has to be 1")
        self.assertEqual(decoded[2]["ordering"], 0, msg="Task ordering has to be 0")
        self.assertEqual(decoded[3]["ordering"], 0, msg="Task ordering has to be 0")
        self.assertEqual(decoded[4]["ordering"], 1, msg="Task ordering has to be 1")

        # check if task3 does not changed the task state from NEW to PROG because he was added to column with task
        # state PROG - state should still be NEW
        self.assertEqual(decoded[2]["task"]["pk"], task3_pk)
        self.assertEqual(decoded[2]["task"]["state"], Task.TASK_STATE_NEW, msg="Task state should not be changed")

        # try to add task1 again to the kanban board into a different column (should not work)
        response = self.rest_add_task_to_kanbanboard_column(
            self.token1, kanban_board_pk, kanban_board_column_done_pk, task1_pk, HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        # check if the task was not added to the kanban column
        response = self.rest_get_tasks_of_kanbanboard(self.token1, kanban_board_pk, HTTP_USER_AGENT, REMOTE_ADDR)
        decoded = json.loads(response.content.decode())
        self.assertEqual(len(decoded), 5, msg="The kanban board should have 5 tasks")

    def test_move_tasks_between_kanban_columns(self):
        """Tasks for moving tasks between kanban columns and check if the task states of the task do not change"""

        # create a new kanban board
        response = self.rest_create_kanbanboard(self.token1, self.project1.pk, "test 1", HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        decoded = json.loads(response.content.decode())

        kanban_board_pk = decoded["pk"]
        kanban_board_columns = decoded["kanban_board_columns"]

        kanban_board = json.loads(response.content.decode())

        # create two more columns (in progress and done)
        kanban_board_columns = kanban_board["kanban_board_columns"]

        # add a new kanban board column
        new_column = {"title": "In Progress", "icon": "", "ordering": 1, "color": "rgba(224,224,224,0.65)"}
        kanban_board_columns.append(new_column)

        new_column = {"title": "Done", "icon": "", "ordering": 2, "color": "rgba(112,112,112,0.65)"}
        kanban_board_columns.append(new_column)

        response = self.rest_update_kanbanboard_child_elements(
            self.token1, kanban_board["pk"], kanban_board_columns, HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        kanban_board_columns = json.loads(response.content.decode())["kanban_board_columns"]

        kanban_board_column_new_pk = kanban_board_columns[0]["pk"]
        kanban_board_column_prog_pk = kanban_board_columns[1]["pk"]
        kanban_board_column_done_pk = kanban_board_columns[2]["pk"]

        # create some tasks
        response = self.rest_create_task(
            self.token1,
            self.project1.pk,
            "New Task 1",
            "Description...",
            Task.TASK_STATE_NEW,
            Task.TASK_PRIORITY_HIGH,
            datetime.now(),
            datetime.now() + timedelta(days=30),
            self.user1.pk,
            HTTP_USER_AGENT,
            REMOTE_ADDR,
        )
        decoded = json.loads(response.content.decode())
        task1_pk = decoded["pk"]
        response = self.rest_create_task(
            self.token1,
            self.project1.pk,
            "New Task 2",
            "Description...",
            Task.TASK_STATE_PROGRESS,
            Task.TASK_PRIORITY_HIGH,
            datetime.now(),
            datetime.now() + timedelta(days=30),
            self.user1.pk,
            HTTP_USER_AGENT,
            REMOTE_ADDR,
        )
        decoded = json.loads(response.content.decode())
        task2_pk = decoded["pk"]
        response = self.rest_create_task(
            self.token1,
            self.project1.pk,
            "New Task 3",
            "Description...",
            Task.TASK_STATE_NEW,
            Task.TASK_PRIORITY_HIGH,
            datetime.now(),
            datetime.now() + timedelta(days=30),
            self.user1.pk,
            HTTP_USER_AGENT,
            REMOTE_ADDR,
        )
        decoded = json.loads(response.content.decode())
        task3_pk = decoded["pk"]

        # add tasks to the kanban columns
        # column with task_state NEW
        #   Task 1
        #   Task 2
        # column with task_state PROG
        #   Task 3
        data = [
            {"kanban_board_column": kanban_board_column_new_pk, "task_id": task1_pk},
            {"kanban_board_column": kanban_board_column_new_pk, "task_id": task2_pk},
            {"kanban_board_column": kanban_board_column_prog_pk, "task_id": task3_pk},
        ]

        response = self.rest_add_tasks_to_kanbanboard_column(
            self.token1, kanban_board_pk, data, HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        decoded = json.loads(response.content.decode())

        task1_assignment_pk = decoded[0]["pk"]
        task2_assignment_pk = decoded[1]["pk"]
        task3_assignment_pk = decoded[2]["pk"]

        # move task1 from column NEW to PROG
        # column with task_state NEW
        #   Task 2
        # column with task_state PROG
        #   Task 3
        #   Task 1
        data = {"assignment_pk": task1_assignment_pk, "to_column": kanban_board_column_prog_pk, "to_index": 1}

        response = self.rest_move_tasks_between_kanbanboard_columns(
            self.token1, kanban_board_pk, data, HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        decoded = json.loads(response.content.decode())

        # check if ordering of the tasks inside each column is correct
        # the response is sorted after the ordering of the tasks so first comes all tasks with ordering 0, than 1, ...
        # verify task 2
        self.assertEqual(decoded[0]["ordering"], 0, msg="Task ordering has to be 0")
        self.assertEqual(decoded[0]["kanban_board_column"], kanban_board_column_new_pk)
        self.assertEqual(decoded[0]["task"]["pk"], task2_pk)
        self.assertEqual(decoded[0]["pk"], task2_assignment_pk)

        # verify task 3
        self.assertEqual(decoded[1]["ordering"], 0, msg="Task ordering has to be 0")
        self.assertEqual(decoded[1]["kanban_board_column"], kanban_board_column_prog_pk)
        self.assertEqual(decoded[1]["task"]["pk"], task3_pk)
        self.assertEqual(decoded[1]["pk"], task3_assignment_pk)

        # verify task 1
        self.assertEqual(decoded[2]["ordering"], 1, msg="Task ordering has to be 1")
        self.assertEqual(decoded[2]["kanban_board_column"], kanban_board_column_prog_pk)
        self.assertEqual(decoded[2]["task"]["pk"], task1_pk)
        self.assertEqual(decoded[2]["pk"], task1_assignment_pk)

        # move task2 from column NEW to DONE
        # column with task_state NEW
        #   -
        # column with task_state PROG
        #   Task 3
        #   Task 1
        # column with task_state DONE
        #   Task 2
        data = {"assignment_pk": task2_assignment_pk, "to_column": kanban_board_column_done_pk, "to_index": 0}

        response = self.rest_move_tasks_between_kanbanboard_columns(
            self.token1, kanban_board_pk, data, HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        decoded = json.loads(response.content.decode())

        # check if ordering of the tasks inside each column is correct
        # the response is sorted after the ordering of the tasks so first comes all tasks with ordering 0, than 1, ...
        self.assertEqual(decoded[0]["ordering"], 0, msg="Task ordering has to be 0")
        self.assertEqual(decoded[1]["ordering"], 1, msg="Task ordering has to be 1")
        self.assertEqual(decoded[2]["ordering"], 0, msg="Task ordering has to be 0")

        # move task2 from column DONE to PROG but between task3 and task1 (ordering of tasks)
        data = {"assignment_pk": task2_assignment_pk, "to_column": kanban_board_column_prog_pk, "to_index": 1}

        response = self.rest_move_tasks_between_kanbanboard_columns(
            self.token1, kanban_board_pk, data, HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        decoded = json.loads(response.content.decode())

        # check if ordering of the tasks inside each column is correct
        # the response is sorted after the ordering of the tasks so first comes all tasks with ordering 0, than 1, ...
        self.assertEqual(decoded[0]["ordering"], 0, msg="Task ordering has to be 0")
        self.assertEqual(decoded[1]["ordering"], 1, msg="Task ordering has to be 1")
        self.assertEqual(decoded[2]["ordering"], 2, msg="Task ordering has to be 2")

        # check if task2 has the ordering 1
        self.assertEqual(decoded[1]["task"]["pk"], task2_pk, msg="task2 is the task with the ordering of 1")

    def test_delete_task_from_kanban_board(self):
        """Tests for removing tasks from the kanban board"""

        # create a new kanban board
        response = self.rest_create_kanbanboard(self.token1, self.project1.pk, "test 1", HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        decoded = json.loads(response.content.decode())
        kanban_board_pk = decoded["pk"]
        kanban_board_columns = decoded["kanban_board_columns"]
        kanban_board_column_new_pk = kanban_board_columns[0]["pk"]

        # create some tasks
        response = self.rest_create_task(
            self.token1,
            self.project1.pk,
            "New Task 1",
            "Description...",
            Task.TASK_STATE_NEW,
            Task.TASK_PRIORITY_HIGH,
            datetime.now(),
            datetime.now() + timedelta(days=30),
            self.user1.pk,
            HTTP_USER_AGENT,
            REMOTE_ADDR,
        )
        decoded = json.loads(response.content.decode())
        task1_pk = decoded["pk"]

        # add tasks to the kanban columns
        # column with task_state NEW
        #   Task 1
        data = [{"kanban_board_column": kanban_board_column_new_pk, "task_id": task1_pk}]

        response = self.rest_add_tasks_to_kanbanboard_column(
            self.token1, kanban_board_pk, data, HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        decoded = json.loads(response.content.decode())

        task1_assignment_pk = decoded[0]["pk"]

        # remove the task from the kanban board
        response = self.rest_delete_task_from_kanbanboard(
            self.token1, kanban_board_pk, task1_assignment_pk, HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

        response = self.rest_get_tasks_of_kanbanboard(self.token1, kanban_board_pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        decoded = json.loads(response.content.decode())

        self.assertEqual(len(decoded), 0, msg="No tasks should be available in this kanban view")

    def test_check_canban_board_permissions(self):
        """Tests for checking the view permission"""

        # create a new kanban board
        response = self.rest_create_kanbanboard(self.token1, self.project1.pk, "test 1", HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        decoded = json.loads(response.content.decode())

        kanban_board_pk = decoded["pk"]
        kanban_board_columns = decoded["kanban_board_columns"]

        kanban_board = json.loads(response.content.decode())

        # unlock kanban board
        response = self.unlock(self.token1, "kanbanboards", kanban_board_pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # create two more columns (in progress and done)
        kanban_board_columns = kanban_board["kanban_board_columns"]

        # add a new kanban board column
        new_column = {"title": "In Progress", "icon": "", "ordering": 1, "color": "rgba(224,224,224,0.65)"}
        kanban_board_columns.append(new_column)

        new_column = {"title": "Done", "icon": "", "ordering": 2, "color": "rgba(112,112,112,0.65)"}
        kanban_board_columns.append(new_column)

        response = self.rest_update_kanbanboard_child_elements(
            self.token1, kanban_board["pk"], kanban_board_columns, HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        kanban_board_columns = json.loads(response.content.decode())["kanban_board_columns"]

        kanban_board_column_new_pk = kanban_board_columns[0]["pk"]
        kanban_board_column_prog_pk = kanban_board_columns[1]["pk"]

        # give user2 the view privilege for this kanban board (which should result in user2 being able to view all
        # tasks in this kanban board)
        response = self.rest_generic_create_privilege(self.token1, kanban_board_pk, self.user2.pk)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        response = self.rest_generic_patch_privilege(
            self.token1, kanban_board_pk, self.user2.pk, {"view_privilege": ModelPrivilege.ALLOW}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # try to view the kanban view as user2 (should work)
        response = self.rest_get_kanbanboard(self.token2, kanban_board_pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # try to add a new kanban board column as user2 (should not work)
        new_column = {"title": "New column", "ordering": 4, "icon": "", "color": "rgba(224,224,224,0.65)"}
        kanban_board_columns.append(new_column)

        response = self.rest_update_kanbanboard_child_elements(
            self.token2, kanban_board_pk, kanban_board_columns, HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # check if no column was added
        response = self.rest_get_kanbanboard(self.token2, kanban_board_pk, HTTP_USER_AGENT, REMOTE_ADDR)
        decoded = json.loads(response.content.decode())
        kanban_board_columns = decoded["kanban_board_columns"]
        self.assertEqual(len(decoded["kanban_board_columns"]), 3, "No column should be added")

        # add a new kanban board column as user1 (should work)
        kanban_board_columns.append(new_column)
        response = self.rest_update_kanbanboard_child_elements(
            self.token1, kanban_board_pk, kanban_board_columns, HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        decoded = json.loads(response.content.decode())
        kanban_board_columns = decoded["kanban_board_columns"]
        self.assertEqual(len(decoded["kanban_board_columns"]), 4, "One column should be added")

        # try to change attributes of a column as user2 (should not work)
        kanban_board_columns[0]["title"] = "Changed column name"
        kanban_board_columns[0]["ordering"] = 1

        response = self.rest_update_kanbanboard_child_elements(
            self.token2, kanban_board_pk, kanban_board_columns, HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # try to add tasks to the columns as user2 (should not work)
        # create some tasks
        response = self.rest_create_task(
            self.token1,
            self.project1.pk,
            "New Task 1",
            "Description...",
            Task.TASK_STATE_NEW,
            Task.TASK_PRIORITY_HIGH,
            datetime.now(),
            datetime.now() + timedelta(days=30),
            self.user1.pk,
            HTTP_USER_AGENT,
            REMOTE_ADDR,
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        decoded = json.loads(response.content.decode())
        task1_pk = decoded["pk"]

        response = self.rest_create_task(
            self.token1,
            self.project1.pk,
            "New Task 2",
            "Description...",
            Task.TASK_STATE_PROGRESS,
            Task.TASK_PRIORITY_HIGH,
            datetime.now(),
            datetime.now() + timedelta(days=30),
            self.user1.pk,
            HTTP_USER_AGENT,
            REMOTE_ADDR,
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        decoded = json.loads(response.content.decode())
        task2_pk = decoded["pk"]

        response = self.rest_create_task(
            self.token1,
            self.project1.pk,
            "New Task 3",
            "Description...",
            Task.TASK_STATE_NEW,
            Task.TASK_PRIORITY_HIGH,
            datetime.now(),
            datetime.now() + timedelta(days=30),
            self.user1.pk,
            HTTP_USER_AGENT,
            REMOTE_ADDR,
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        decoded = json.loads(response.content.decode())
        task3_pk = decoded["pk"]

        # check which kanban boards task1 is in (should be none)
        response = self.rest_get_kanbanboards_and_columns_of_task(self.token1, task1_pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        decoded = json.loads(response.content.decode())
        self.assertEqual(len(decoded), 0, msg="Task 1 should be in zero kanban boards")

        # check which kanban boards task2 is in (should be none)
        response = self.rest_get_kanbanboards_and_columns_of_task(self.token1, task2_pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        decoded = json.loads(response.content.decode())
        self.assertEqual(len(decoded), 0, msg="Task 2 should be in zero kanban boards")

        # check which kanban boards task3 is in (should be none)
        response = self.rest_get_kanbanboards_and_columns_of_task(self.token1, task3_pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        decoded = json.loads(response.content.decode())
        self.assertEqual(len(decoded), 0, msg="Task 3 should be in zero kanban boards")

        # add one task to kanban column as user2 (should not work)
        response = self.rest_add_task_to_kanbanboard_column(
            self.token2, kanban_board_pk, kanban_board_column_new_pk, task1_pk, HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

        # check which kanban boards task1 is in with user1 (should be none)
        response = self.rest_get_kanbanboards_and_columns_of_task(self.token1, task1_pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        decoded = json.loads(response.content.decode())
        self.assertEqual(len(decoded), 0, msg="Task 1 should be in zero kanban boards")

        # check which kanban boards task1 is in with user2 (should end in a 404, as user2 does not have read access)
        response = self.rest_get_kanbanboards_and_columns_of_task(self.token2, task1_pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

        # give user2 view privileges for the task1, task2 and task3
        response = self.rest_create_privilege(
            self.token1, "tasks", task1_pk, self.user2.pk, HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        response = self.rest_patch_privilege(
            self.token1,
            "tasks",
            task1_pk,
            self.user2.pk,
            {"view_privilege": ModelPrivilege.ALLOW},
            HTTP_USER_AGENT,
            REMOTE_ADDR,
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        response = self.rest_create_privilege(
            self.token1, "tasks", task2_pk, self.user2.pk, HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        response = self.rest_patch_privilege(
            self.token1,
            "tasks",
            task2_pk,
            self.user2.pk,
            {"view_privilege": ModelPrivilege.ALLOW},
            HTTP_USER_AGENT,
            REMOTE_ADDR,
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        response = self.rest_create_privilege(
            self.token1, "tasks", task3_pk, self.user2.pk, HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        response = self.rest_patch_privilege(
            self.token1,
            "tasks",
            task3_pk,
            self.user2.pk,
            {"view_privilege": ModelPrivilege.ALLOW},
            HTTP_USER_AGENT,
            REMOTE_ADDR,
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # try again to add one task to kanban column as user2 (should not work)
        response = self.rest_add_task_to_kanbanboard_column(
            self.token2, kanban_board_pk, kanban_board_column_new_pk, task1_pk, HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # check which kanban boards task1 is in with user1 (should be none)
        response = self.rest_get_kanbanboards_and_columns_of_task(self.token1, task1_pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        decoded = json.loads(response.content.decode())
        self.assertEqual(len(decoded), 0, msg="Task 1 should be in zero kanban boards")

        # check if no tasks were added to the kanban board
        response = self.rest_get_tasks_of_kanbanboard(self.token2, kanban_board_pk, HTTP_USER_AGENT, REMOTE_ADDR)
        decoded = json.loads(response.content.decode())
        self.assertEqual(len(decoded), 0, msg="The kanban board should have no tasks")

        # add some tasks to the kanban board as user2 (should not work)
        data = [
            {"kanban_board_column": kanban_board_column_new_pk, "task_id": task1_pk},
            {"kanban_board_column": kanban_board_column_new_pk, "task_id": task2_pk},
            {"kanban_board_column": kanban_board_column_prog_pk, "task_id": task3_pk},
        ]

        response = self.rest_add_tasks_to_kanbanboard_column(
            self.token2, kanban_board_pk, data, HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # check if no tasks were added to the kanban board
        response = self.rest_get_tasks_of_kanbanboard(self.token2, kanban_board_pk, HTTP_USER_AGENT, REMOTE_ADDR)
        decoded = json.loads(response.content.decode())
        self.assertEqual(len(decoded), 0, msg="The kanban board should have no tasks")

        # add one task to the kanban board as user1 (should work)
        response = self.rest_add_task_to_kanbanboard_column(
            self.token1, kanban_board_pk, kanban_board_column_new_pk, task1_pk, HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        decoded = json.loads(response.content.decode())
        task1_assignment_pk = decoded["pk"]

        # check which kanban boards task1 is in with user1 (should be ONE)
        response = self.rest_get_kanbanboards_and_columns_of_task(self.token1, task1_pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        decoded = json.loads(response.content.decode())
        self.assertEqual(len(decoded), 1, msg="Task 1 should be in one kanban boards")

        # check which kanban boards task1 is in with user2 (should be ONE)
        response = self.rest_get_kanbanboards_and_columns_of_task(self.token2, task1_pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        decoded = json.loads(response.content.decode())
        self.assertEqual(len(decoded), 1, msg="Task 1 should be in one kanban boards")

        # however, task2 should still be in no kanban boards
        response = self.rest_get_kanbanboards_and_columns_of_task(self.token1, task2_pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        decoded = json.loads(response.content.decode())
        self.assertEqual(len(decoded), 0, msg="Task 1 should be in no kanban boards")

        # try to delete the task from the kanban board as user2 (should not work)
        response = self.rest_delete_task_from_kanbanboard(
            self.token2, kanban_board_pk, task1_assignment_pk, HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # check if task was not deleted
        response = self.rest_get_tasks_of_kanbanboard(self.token2, kanban_board_pk, HTTP_USER_AGENT, REMOTE_ADDR)
        decoded = json.loads(response.content.decode())
        self.assertEqual(len(decoded), 1, msg="The kanban board should have 1 task")

        # try to delete a column as user2 (should not work)
        del kanban_board_columns[3]
        response = self.rest_update_kanbanboard_child_elements(
            self.token2, kanban_board_pk, kanban_board_columns, HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # check if the column was not deleted
        response = self.rest_get_kanbanboard(self.token2, kanban_board_pk, HTTP_USER_AGENT, REMOTE_ADDR)
        decoded = json.loads(response.content.decode())
        kanban_board_columns = decoded["kanban_board_columns"]
        self.assertEqual(len(decoded["kanban_board_columns"]), 4, msg="The kanban board should have 4 columns")

        # give user2 edit permissions for the kanban view
        response = self.rest_generic_patch_privilege(
            self.token1, kanban_board_pk, self.user2.pk, {"edit_privilege": ModelPrivilege.ALLOW}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # unlock kanban board with user1
        response = self.unlock(self.token1, "kanbanboards", kanban_board_pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # add a new kanban board column as user2 (should work)
        new_column_1 = {
            "title": "New column",
            "task_state": Task.TASK_STATE_NEW,
            "icon": "",
            "ordering": 3,
            "color": "rgba(224,224,224,0.65)",
        }
        kanban_board_columns.append(new_column_1)
        response = self.rest_update_kanbanboard_child_elements(
            self.token2, kanban_board_pk, kanban_board_columns, HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        decoded = json.loads(response.content.decode())
        kanban_board_columns = decoded["kanban_board_columns"]

        # try to change attributes of a column as user2 (should work)
        kanban_board_columns[0]["title"] = "Changed column name"
        kanban_board_columns[0]["ordering"] = 1

        response = self.rest_update_kanbanboard_child_elements(
            self.token2, kanban_board_pk, kanban_board_columns, HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # try to add a task to one column as user2 (should work)
        response = self.rest_add_task_to_kanbanboard_column(
            self.token2, kanban_board_pk, kanban_board_column_new_pk, task2_pk, HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # check if task was added
        response = self.rest_get_tasks_of_kanbanboard(self.token2, kanban_board_pk, HTTP_USER_AGENT, REMOTE_ADDR)
        decoded = json.loads(response.content.decode())
        self.assertEqual(len(decoded), 2, msg="A new task was added to the kanban board")

        # try to delete the task from the kanban board as user2 (should work)
        response = self.rest_delete_task_from_kanbanboard(
            self.token2, kanban_board_pk, task1_assignment_pk, HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

        # check if task was deleted
        response = self.rest_get_tasks_of_kanbanboard(self.token2, kanban_board_pk, HTTP_USER_AGENT, REMOTE_ADDR)
        decoded = json.loads(response.content.decode())
        self.assertEqual(len(decoded), 1, msg="The task was deleted from the kanban board")

        # try to delete a column as user2 (should work)
        del kanban_board_columns[3]
        response = self.rest_update_kanbanboard_child_elements(
            self.token2, kanban_board_pk, kanban_board_columns, HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # check if column was deleted
        response = self.rest_get_kanbanboard(self.token2, kanban_board_pk, HTTP_USER_AGENT, REMOTE_ADDR)
        decoded = json.loads(response.content.decode())
        kanban_board_columns = decoded["kanban_board_columns"]
        self.assertEqual(len(decoded["kanban_board_columns"]), 4, "Column should be deleted")

        # now remove the edit privilege of user2 (set to neutral)
        response = self.rest_generic_patch_privilege(
            self.token1, kanban_board_pk, self.user2.pk, {"edit_privilege": ModelPrivilege.NEUTRAL}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # try to delete a column as user2 (should not work)
        del kanban_board_columns[2]
        response = self.rest_update_kanbanboard_child_elements(
            self.token2, kanban_board_pk, kanban_board_columns, HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # check if column was not deleted
        response = self.rest_get_kanbanboard(self.token2, kanban_board_pk, HTTP_USER_AGENT, REMOTE_ADDR)
        decoded = json.loads(response.content.decode())
        self.assertEqual(len(decoded["kanban_board_columns"]), 4, "No column should be deleted")

    def test_can_not_edit_task_although_it_is_in_kanban_board(self):
        """
        The assignment of a task to a kanban board should only modify the view privileges of a user for the task
        :return:
        """
        # user1 creates a task that only user1 has access to
        response = self.rest_create_task(
            self.token1,
            None,
            "Some secret task",
            "Some secret description",
            Task.TASK_STATE_NEW,
            Task.TASK_PRIORITY_HIGH,
            datetime.now(),
            datetime.now() + timedelta(hours=1),
            self.user1.pk,
            HTTP_USER_AGENT,
            REMOTE_ADDR,
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        decoded_task = json.loads(response.content.decode())

        # unlock task with user1
        response = self.unlock(self.token1, "tasks", decoded_task["pk"], HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # get the task
        task = Task.objects.filter(pk=decoded_task["pk"]).first()

        # user2 now creates a new kanban board
        response = self.rest_create_kanbanboard(self.token2, None, "test 1", HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        decoded_kanban_board = json.loads(response.content.decode())
        kanban_board_pk = decoded_kanban_board["pk"]

        decoded = json.loads(response.content.decode())
        kanban_board_columns = decoded["kanban_board_columns"]

        data = [{"kanban_board_column": kanban_board_columns[0]["pk"], "task_id": task.pk}]

        # user2 tries to add the task that user1 created (should not work, as user2 has no view privilege on the task)
        response = self.rest_add_tasks_to_kanbanboard_column(
            self.token2, kanban_board_pk, data, HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

        # verify that no new assignment was created
        self.assertEqual(KanbanBoardColumnTaskAssignment.objects.all().count(), 0)

        # user1 has the view privilege on the task, but does not have any privileges on the kanban board
        # therefore user1 should not be able to add this task to the kanban board
        response = self.rest_add_tasks_to_kanbanboard_column(
            self.token1, kanban_board_pk, data, HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

        # verify that no new assignment was created
        self.assertEqual(KanbanBoardColumnTaskAssignment.objects.all().count(), 0)

        # try to retrieve all tasks that user2 has access to (should be zero tasks)
        response = self.rest_get_tasks(self.token2, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        decoded_response = json.loads(response.content.decode())
        decoded_response = test_utils.get_paginated_results(decoded_response)
        self.assertEqual(len(decoded_response), 0)

        # give user1 the view and edit privilege of the kanban board (user2 created the kanban board)
        response = self.rest_create_privilege(
            self.token2, "kanbanboards", kanban_board_pk, self.user1.pk, HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # patch the privileges with the view and edit privilege for user1
        response = self.rest_patch_privilege(
            self.token2,
            "kanbanboards",
            kanban_board_pk,
            self.user1.pk,
            {"view_privilege": ModelPrivilege.ALLOW, "edit_privilege": ModelPrivilege.ALLOW},
            HTTP_USER_AGENT,
            REMOTE_ADDR,
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # now user1 should be able to add a task to the kanban board
        response = self.rest_add_tasks_to_kanbanboard_column(
            self.token1, kanban_board_pk, data, HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # there should be one assignment (the one that we just created)
        self.assertEqual(KanbanBoardColumnTaskAssignment.objects.all().count(), 1)

        # try to retrieve all tasks that user2 has access to (now task2 is in the kanban board -> user2 can view it)
        response = self.rest_get_tasks(self.token2, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        decoded_response = json.loads(response.content.decode())
        decoded_response = test_utils.get_paginated_results(decoded_response)
        self.assertEqual(len(decoded_response), 1)
        # verify that the correct task is returned
        self.assertEqual(decoded_response[0]["pk"], str(task.pk))

        # check privileges of user2 on task (user2 should have view privilege)
        response = self.rest_get_privileges_for_user(
            self.token1, "tasks", task.pk, self.user2.pk, HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        decoded_privilege = json.loads(response.content.decode())
        self.assertEqual(decoded_privilege["view_privilege"], ModelPrivilege.ALLOW)

        # try to update the task with user2 (should not work)
        response = self.rest_update_task(
            self.token2,
            task.pk,
            None,
            "oops",
            "oh no",
            Task.TASK_STATE_NEW,
            Task.TASK_PRIORITY_HIGH,
            datetime.now(),
            datetime.now() + timedelta(hours=1),
            self.user1.pk,
            HTTP_USER_AGENT,
            REMOTE_ADDR,
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_background_image_and_color(self):
        client = KanbanBoardClient(self.client, HTTP_USER_AGENT, REMOTE_ADDR, asserter=self)
        client.with_auth_token(self.token1)

        # create Kanban board
        response = client.post(
            {
                "title": "my task board",
            }
        )
        board_pk = response["pk"]

        # set background color
        initial_bg_color = "rgba(255,0,0,1)"
        response = client.patch(board_pk, {"background_color": initial_bg_color})

        # check background color is set and there is no background image
        self.assertEqual(response["background_color"], initial_bg_color)
        self.assertIsNone(response["background_image_thumbnail"])
        self.assertIsNone(response["download_background_image"])
        self.assertIsNone(response["download_background_image_thumbnail"])

        # set background image
        jpeg_with_one_green_pixel = b'\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00`\x00`\x00\x00\xff\xdb\x00C\x00\x02\x01\x01\x02\x01\x01\x02\x02\x02\x02\x02\x02\x02\x02\x03\x05\x03\x03\x03\x03\x03\x06\x04\x04\x03\x05\x07\x06\x07\x07\x07\x06\x07\x07\x08\t\x0b\t\x08\x08\n\x08\x07\x07\n\r\n\n\x0b\x0c\x0c\x0c\x0c\x07\t\x0e\x0f\r\x0c\x0e\x0b\x0c\x0c\x0c\xff\xdb\x00C\x01\x02\x02\x02\x03\x03\x03\x06\x03\x03\x06\x0c\x08\x07\x08\x0c\x0c\x0c\x0c\x0c\x0c\x0c\x0c\x0c\x0c\x0c\x0c\x0c\x0c\x0c\x0c\x0c\x0c\x0c\x0c\x0c\x0c\x0c\x0c\x0c\x0c\x0c\x0c\x0c\x0c\x0c\x0c\x0c\x0c\x0c\x0c\x0c\x0c\x0c\x0c\x0c\x0c\x0c\x0c\x0c\x0c\x0c\x0c\x0c\x0c\xff\xc0\x00\x11\x08\x00\x01\x00\x01\x03\x01"\x00\x02\x11\x01\x03\x11\x01\xff\xc4\x00\x1f\x00\x00\x01\x05\x01\x01\x01\x01\x01\x01\x00\x00\x00\x00\x00\x00\x00\x00\x01\x02\x03\x04\x05\x06\x07\x08\t\n\x0b\xff\xc4\x00\xb5\x10\x00\x02\x01\x03\x03\x02\x04\x03\x05\x05\x04\x04\x00\x00\x01}\x01\x02\x03\x00\x04\x11\x05\x12!1A\x06\x13Qa\x07"q\x142\x81\x91\xa1\x08#B\xb1\xc1\x15R\xd1\xf0$3br\x82\t\n\x16\x17\x18\x19\x1a%&\'()*456789:CDEFGHIJSTUVWXYZcdefghijstuvwxyz\x83\x84\x85\x86\x87\x88\x89\x8a\x92\x93\x94\x95\x96\x97\x98\x99\x9a\xa2\xa3\xa4\xa5\xa6\xa7\xa8\xa9\xaa\xb2\xb3\xb4\xb5\xb6\xb7\xb8\xb9\xba\xc2\xc3\xc4\xc5\xc6\xc7\xc8\xc9\xca\xd2\xd3\xd4\xd5\xd6\xd7\xd8\xd9\xda\xe1\xe2\xe3\xe4\xe5\xe6\xe7\xe8\xe9\xea\xf1\xf2\xf3\xf4\xf5\xf6\xf7\xf8\xf9\xfa\xff\xc4\x00\x1f\x01\x00\x03\x01\x01\x01\x01\x01\x01\x01\x01\x01\x00\x00\x00\x00\x00\x00\x01\x02\x03\x04\x05\x06\x07\x08\t\n\x0b\xff\xc4\x00\xb5\x11\x00\x02\x01\x02\x04\x04\x03\x04\x07\x05\x04\x04\x00\x01\x02w\x00\x01\x02\x03\x11\x04\x05!1\x06\x12AQ\x07aq\x13"2\x81\x08\x14B\x91\xa1\xb1\xc1\t#3R\xf0\x15br\xd1\n\x16$4\xe1%\xf1\x17\x18\x19\x1a&\'()*56789:CDEFGHIJSTUVWXYZcdefghijstuvwxyz\x82\x83\x84\x85\x86\x87\x88\x89\x8a\x92\x93\x94\x95\x96\x97\x98\x99\x9a\xa2\xa3\xa4\xa5\xa6\xa7\xa8\xa9\xaa\xb2\xb3\xb4\xb5\xb6\xb7\xb8\xb9\xba\xc2\xc3\xc4\xc5\xc6\xc7\xc8\xc9\xca\xd2\xd3\xd4\xd5\xd6\xd7\xd8\xd9\xda\xe2\xe3\xe4\xe5\xe6\xe7\xe8\xe9\xea\xf2\xf3\xf4\xf5\xf6\xf7\xf8\xf9\xfa\xff\xda\x00\x0c\x03\x01\x00\x02\x11\x03\x11\x00?\x00\xfd\x00\xa2\x8a+\xfc\x8f>|\xff\xd9'
        response = client.update_background_image(board_pk, jpeg_with_one_green_pixel)

        # check background image and color is set
        self.assertFalse(response["background_image_thumbnail"] in [None, ""])
        self.assertFalse(response["download_background_image"] in [None, ""])
        self.assertFalse(response["download_background_image_thumbnail"] in [None, ""])
        self.assertEqual(response["background_color"], initial_bg_color)

        # set new color
        second_bg_color = "rgba(0,0,255,1)"
        response = client.patch(board_pk, data={"background_color": second_bg_color})

        # check that the background image is removed
        self.assertEqual(response["background_color"], second_bg_color)
        self.assertIsNone(response["background_image_thumbnail"])
        self.assertIsNone(response["download_background_image"])
        self.assertIsNone(response["download_background_image_thumbnail"])
