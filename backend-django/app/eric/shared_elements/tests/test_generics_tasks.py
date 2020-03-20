#
# Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
# SPDX-License-Identifier: AGPL-3.0-or-later
#
import json

from django.utils import timezone
from django.utils.timezone import datetime, timedelta
from rest_framework.test import APITestCase
from rest_framework import status

from eric.projects.models import Project
from eric.shared_elements.models import Task, TaskCheckList
from eric.projects.tests.mixin_entity_generic_tests import EntityChangeRelatedProjectTestMixin
from eric.model_privileges.models import ModelPrivilege
from eric.shared_elements.tests.core import ElementLabelMixin
from eric.core.tests import test_utils

HTTP_USER_AGENT = "APITestClient"
REMOTE_ADDR = "127.0.0.1"


class TestGenericsTasks(APITestCase, EntityChangeRelatedProjectTestMixin, ElementLabelMixin):
    entity = Task

    def setUp(self):
        self.superSetUp()

        self.data = [{
            'title': "Test Task One",
            'description': "<p>Some <b>Task</b> Description</p>",
            'project_pks': None,
            'state': Task.TASK_STATE_NEW,
            'priority': 'HIGH',
            'start_date': datetime.now(),
            'due_date': datetime.now()+timedelta(days=1),
            'assigned_user': []
        }, {
            'title': "Another Test Task",
            'description': "Yet Another Test Description",
            'project_pks': None,
            'state': Task.TASK_STATE_NEW,
            'priority': 'LOW',
            'start_date': datetime.now(),
            'due_date': datetime.now()+timedelta(hours=1),
            'assigned_user': []
        }]

    def test_task_privileges_for_assigned_users(self):
        """
        Tests that assigned users of a task automatically get the view and edit privilege
        :return:
        """
        # create a new task with user1 (should work)
        response = self.rest_create_task(self.token1,
                                         HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR, **self.data[0])
        self.assertEquals(response.status_code, status.HTTP_201_CREATED)
        decoded_response = json.loads(response.content.decode())
        task = Task.objects.filter(pk=decoded_response['pk']).first()

        # query all tasks with user2 (should be zero tasks)
        response = self.rest_get_tasks(self.token2, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_200_OK)
        decoded_list = json.loads(response.content.decode())
        decoded_list = test_utils.get_paginated_results(decoded_list)
        self.assertEquals(len(decoded_list), 0, msg="User 2 should see 0 tasks")

        # add user2 as an assigned user of the task
        response = self.rest_update_task_assigned_users(self.token1, task.pk, [self.user2.pk],
                                                        HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # now user2 should see the task
        response = self.rest_get_tasks(self.token2, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_200_OK)
        decoded_list = json.loads(response.content.decode())
        decoded_list = test_utils.get_paginated_results(decoded_list)
        self.assertEquals(len(decoded_list), 1, msg="User 2 should see 1 task")

        # and there should be a view and edit privilege listed for user 2
        response = self.rest_get_privileges(self.token1, "tasks", task.pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_200_OK)
        decoded_privileges = json.loads(response.content.decode())
        self.assertEquals(len(decoded_privileges), 2, msg="There should be two privileges for this task")
        # privilege 0 should be for user1
        self.assertEquals(decoded_privileges[0]['user']['pk'], self.user1.pk)
        # and privilege 1 should be for user2
        self.assertEquals(decoded_privileges[1]['user']['pk'], self.user2.pk)
        # verify that user1 is the owner
        self.assertEquals(decoded_privileges[0]['full_access_privilege'], ModelPrivilege.PRIVILEGE_CHOICES_ALLOW)
        # verify that user2 only has view and edit privilege
        self.assertEquals(decoded_privileges[1]['full_access_privilege'], ModelPrivilege.PRIVILEGE_CHOICES_NEUTRAL)
        self.assertEquals(decoded_privileges[1]['view_privilege'], ModelPrivilege.PRIVILEGE_CHOICES_ALLOW)
        self.assertEquals(decoded_privileges[1]['edit_privilege'], ModelPrivilege.PRIVILEGE_CHOICES_ALLOW)
        self.assertEquals(decoded_privileges[1]['delete_privilege'], ModelPrivilege.PRIVILEGE_CHOICES_NEUTRAL)
        self.assertEquals(decoded_privileges[1]['restore_privilege'], ModelPrivilege.PRIVILEGE_CHOICES_NEUTRAL)

        # now override the view_privilege for user2
        decoded_privileges[1]['view_privilege'] = ModelPrivilege.PRIVILEGE_CHOICES_DENY
        response = self.rest_update_privilege(self.token1, "tasks", task.pk,
                                              self.user2.pk, decoded_privileges[1], HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # now user2 should not be able to see the task
        response = self.rest_get_task(self.token2, task.pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_404_NOT_FOUND)

        # querying the privileges endpoint should show that the view privilege has been denied for user2
        response = self.rest_get_privileges(self.token1, "tasks", task.pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_200_OK)
        decoded_privileges = json.loads(response.content.decode())
        self.assertEquals(len(decoded_privileges), 2, msg="There should be two privileges for this task")
        # privilege 0 should be for user1
        self.assertEquals(decoded_privileges[0]['user']['pk'], self.user1.pk)
        # and privilege 1 should be for user2
        self.assertEquals(decoded_privileges[1]['user']['pk'], self.user2.pk)
        # verify that user1 is the owner
        self.assertEquals(decoded_privileges[0]['full_access_privilege'], ModelPrivilege.PRIVILEGE_CHOICES_ALLOW)
        # verify that user2 only has view and edit privilege
        self.assertEquals(decoded_privileges[1]['full_access_privilege'], ModelPrivilege.PRIVILEGE_CHOICES_NEUTRAL)
        self.assertEquals(decoded_privileges[1]['view_privilege'], ModelPrivilege.PRIVILEGE_CHOICES_DENY)
        self.assertEquals(decoded_privileges[1]['edit_privilege'], ModelPrivilege.PRIVILEGE_CHOICES_ALLOW)
        self.assertEquals(decoded_privileges[1]['delete_privilege'], ModelPrivilege.PRIVILEGE_CHOICES_NEUTRAL)
        self.assertEquals(decoded_privileges[1]['restore_privilege'], ModelPrivilege.PRIVILEGE_CHOICES_NEUTRAL)

    def test_create_update_task_checklist(self):
        """
        Tests creating a new task with checklist and updating the checklist afterwards
        :return:
        """
        # verify that no checklist items exiset yet
        self.assertEquals(TaskCheckList.objects.all().count(), 0)

        task_data = self.data[0].copy()
        task_data['checklist_items'] = [
            {
                'title': "Analyze",
                'checked': False
            },
            {
                'title': "Fix",
                'checked': True,
            },
            {
                'title': "Testing",
                'checked': False,
            },
            {
                'title': "Quality Assurance",
                'checked': False
            }
        ]

        response = self.rest_create_task(
            self.token1, HTTP_USER_AGENT=HTTP_USER_AGENT, REMOTE_ADDR=REMOTE_ADDR, **task_data
        )

        self.assertEquals(response.status_code, status.HTTP_201_CREATED)
        decoded_response = json.loads(response.content.decode())
        # verify that checklist_items is in response
        self.assertTrue('checklist_items' in decoded_response)
        self.assertEquals(len(decoded_response['checklist_items']), len(task_data['checklist_items']))

        # verify checklist items have been created
        self.assertEquals(TaskCheckList.objects.all().count(), len(task_data['checklist_items']))
        # verify that all those checklist items have the task instance set
        self.assertEquals(
            TaskCheckList.objects.filter(task=decoded_response['pk']).count(),
            len(task_data['checklist_items'])
        )
        # verify that only one of them is checked
        self.assertEquals(
            TaskCheckList.objects.filter(task=decoded_response['pk'], checked=True).count(),
            1
        )

        task_data['checklist_items'] = decoded_response['checklist_items']

        # now try to update the checklist items (check another item)
        task_data['checklist_items'][0]['checked'] = True
        response = self.rest_update_task_checklist_items(
            self.token1, decoded_response['pk'], task_data['checklist_items'], HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEquals(response.status_code, status.HTTP_200_OK)
        # there should still be the same amount of items in database
        self.assertEquals(
            TaskCheckList.objects.filter(task=decoded_response['pk']).count(),
            len(task_data['checklist_items'])
        )
        # but two of them should be checked now
        self.assertEquals(
            TaskCheckList.objects.filter(task=decoded_response['pk'], checked=True).count(),
            2
        )

        # now add another item to checklist_items
        task_data['checklist_items'].append({
            'title': "Paid by customer",
            'checked': False
        })
        response = self.rest_update_task_checklist_items(
            self.token1, decoded_response['pk'], task_data['checklist_items'], HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEquals(response.status_code, status.HTTP_200_OK)
        # there should now be on additional item
        self.assertEquals(
            TaskCheckList.objects.filter(task=decoded_response['pk']).count(),
            len(task_data['checklist_items'])
        )
        # and still, two of them should be checked
        self.assertEquals(
            TaskCheckList.objects.filter(task=decoded_response['pk'], checked=True).count(),
            2
        )

        # now remove the first item of checklist items (the first item is checked)
        task_data['checklist_items'] = task_data['checklist_items'][1:4]

        response = self.rest_update_task_checklist_items(
            self.token1, decoded_response['pk'], task_data['checklist_items'], HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEquals(response.status_code, status.HTTP_200_OK)
        # there should now be on additional item
        self.assertEquals(
            TaskCheckList.objects.filter(task=decoded_response['pk']).count(),
            len(task_data['checklist_items'])
        )
        # there should now only be 1 checked item
        self.assertEquals(
            TaskCheckList.objects.filter(task=decoded_response['pk'], checked=True).count(),
            1
        )

        # now remove all checklist items
        response = self.rest_update_task_checklist_items(
            self.token1, decoded_response['pk'], [], HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEquals(response.status_code, status.HTTP_200_OK)
        # there should be 0 items in TaskCheckList
        self.assertEquals(TaskCheckList.objects.all().count(), 0)

    def test_projects_task_state_summary(self):
        """ Tests the project task state summary (see ProjectSerializerExtended.get_tasks_status) """
        # create several tasks for a project and see if the task status summary lists them
        self.assertEquals(Task.objects.all().count(), 0)

        # create project 1
        response = self.rest_create_project(self.token1, "My Master Project", "Some description", "INIT", HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_201_CREATED)
        decoded_project1 = json.loads(response.content.decode())
        project1 = Project.objects.filter(pk=decoded_project1['pk']).first()

        # create project 2, which is a sub project of project 1
        response = self.rest_create_project(self.token1, "My Sub Project", "Some description", "INIT", HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_201_CREATED)
        decoded_project2 = json.loads(response.content.decode())
        project2 = Project.objects.filter(pk=decoded_project2['pk']).first()

        # set parent project
        response = self.rest_set_parent_project(self.token1, project2, project1)
        self.assertEquals(response.status_code, status.HTTP_200_OK)
        project1.refresh_from_db()
        project2.refresh_from_db()
        self.assertEquals(project2.parent_project.pk, project1.pk)

        # create Task 1 within Project 1
        response = self.rest_create_task(
            self.token1, project1.pk, "Task 1", "Desc 1",
            Task.TASK_STATE_NEW, Task.TASK_PRIORITY_NORMAL, timezone.now(), timezone.now() + timedelta(hours=1),
            [self.user1.pk],
            HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEquals(response.status_code, status.HTTP_201_CREATED)
        decoded_response = json.loads(response.content.decode())
        task1 = Task.objects.filter(pk=decoded_response['pk']).first()

        # get project 1 so we can check the summary
        response = self.rest_get_project(self.token1, project1.pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_200_OK)
        decoded_response = json.loads(response.content.decode())

        # check tasks_status is in decoded_response
        self.assertIn('tasks_status', decoded_response)

        # verify tasks_status has all three states
        self.assertIn(Task.TASK_STATE_NEW, decoded_response['tasks_status'])
        self.assertIn(Task.TASK_STATE_PROGRESS, decoded_response['tasks_status'])
        self.assertIn(Task.TASK_STATE_DONE, decoded_response['tasks_status'])

        # task 1 has the status NEW and this should be reflected in tasks_status (1,0,0)
        self.assertEquals(decoded_response['tasks_status'][Task.TASK_STATE_NEW], 1)
        self.assertEquals(decoded_response['tasks_status'][Task.TASK_STATE_PROGRESS], 0)
        self.assertEquals(decoded_response['tasks_status'][Task.TASK_STATE_DONE], 0)

        # project 2 should have 0,0,0
        response = self.rest_get_project(self.token1, project2.pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_200_OK)
        decoded_response = json.loads(response.content.decode())

        self.assertEquals(decoded_response['tasks_status'][Task.TASK_STATE_NEW], 0)
        self.assertEquals(decoded_response['tasks_status'][Task.TASK_STATE_PROGRESS], 0)
        self.assertEquals(decoded_response['tasks_status'][Task.TASK_STATE_DONE], 0)

        # now add a task to project2
        response = self.rest_create_task(
            self.token1, project2.pk, "Task 2", "Desc 2",
            Task.TASK_STATE_DONE, Task.TASK_PRIORITY_NORMAL, timezone.now(), timezone.now() + timedelta(hours=1),
            [self.user1.pk],
            HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEquals(response.status_code, status.HTTP_201_CREATED)
        decoded_response = json.loads(response.content.decode())
        task2 = Task.objects.filter(pk=decoded_response['pk']).first()

        # this task should appear in project 2 tasks_status: 0,0,1
        response = self.rest_get_project(self.token1, project2.pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_200_OK)
        decoded_response = json.loads(response.content.decode())

        self.assertEquals(decoded_response['tasks_status'][Task.TASK_STATE_NEW], 0)
        self.assertEquals(decoded_response['tasks_status'][Task.TASK_STATE_PROGRESS], 0)
        self.assertEquals(decoded_response['tasks_status'][Task.TASK_STATE_DONE], 1)

        # and it should additionally appear in project1, as project2 is a sub-project of project1
        response = self.rest_get_project(self.token1, project1.pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_200_OK)
        decoded_response = json.loads(response.content.decode())

        self.assertEquals(decoded_response['tasks_status'][Task.TASK_STATE_NEW], 1)
        self.assertEquals(decoded_response['tasks_status'][Task.TASK_STATE_PROGRESS], 0)
        self.assertEquals(decoded_response['tasks_status'][Task.TASK_STATE_DONE], 1)

        # now add task2 to project1 (so it is in project1 and project2)
        response = self.rest_update_task_project(self.token1, task2.pk, [project1.pk, project2.pk], HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        # tasks_status of project2 should still be 0,0,1
        response = self.rest_get_project(self.token1, project2.pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_200_OK)
        decoded_response = json.loads(response.content.decode())

        self.assertEquals(decoded_response['tasks_status'][Task.TASK_STATE_NEW], 0)
        self.assertEquals(decoded_response['tasks_status'][Task.TASK_STATE_PROGRESS], 0)
        self.assertEquals(decoded_response['tasks_status'][Task.TASK_STATE_DONE], 1)

        # tasks_status of project1 should also still be 1,0,1
        response = self.rest_get_project(self.token1, project1.pk, HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_200_OK)
        decoded_response = json.loads(response.content.decode())

        self.assertEquals(decoded_response['tasks_status'][Task.TASK_STATE_NEW], 1)
        self.assertEquals(decoded_response['tasks_status'][Task.TASK_STATE_PROGRESS], 0)
        self.assertEquals(decoded_response['tasks_status'][Task.TASK_STATE_DONE], 1)

    def test_task_element_labels(self):
        """
        Tests creating a task and adding labels to it
        :return:
        """
        # create Task
        response = self.rest_create_task(
            self.token1, None, "Task 1", "Desc 1",
            Task.TASK_STATE_NEW, Task.TASK_PRIORITY_NORMAL, timezone.now(), timezone.now() + timedelta(hours=1),
            [self.user1.pk],
            HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEquals(response.status_code, status.HTTP_201_CREATED)
        decoded_response = json.loads(response.content.decode())
        task = Task.objects.filter(pk=decoded_response['pk']).first()

        # create a new label
        response = self.rest_create_label(self.token1, "Important Label", "rgba(50,50,50,1)", HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_201_CREATED)
        label1 = json.loads(response.content.decode())

        # create another label
        response = self.rest_create_label(self.token1, "Readme", "rgba(50,50,50,1)", HTTP_USER_AGENT, REMOTE_ADDR)
        self.assertEquals(response.status_code, status.HTTP_201_CREATED)
        label2 = json.loads(response.content.decode())

        # update task with labels
        response = self.rest_update_task_partial(
            self.token1, str(task.pk), {"labels": [label1['pk'], label2['pk']]}, HTTP_USER_AGENT, REMOTE_ADDR
        )
        self.assertEquals(response.status_code, status.HTTP_200_OK)

        task.refresh_from_db()

        self.assertEquals(task.labels.all().count(), 2)
