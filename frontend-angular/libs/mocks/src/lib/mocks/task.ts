/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type { DjangoAPI, KanbanTask, RecentChanges, Task, TaskBoardAssignment, TaskPayload, Version } from '@eworkbench/types';
import { mockTaskBoardColumn } from './task-board';
import { mockUser } from './user';

export const mockTaskPayload: TaskPayload = {
  assigned_users_pk: [],
  remind_assignees: false,
  reminder_datetime: null,
  checklist_items: [],
  labels: [],
  due_date: '2020-01-01 12:00',
  start_date: '2020-01-01 10:00',
  projects: [],
  title: 'Task',
  state: 'NEW',
  priority: 'NORM',
  full_day: false,
};

export const mockTask: Task = {
  assigned_users: [],
  assigned_users_pk: [],
  remind_assignees: false,
  reminder_datetime: null,
  checklist_items: [],
  content_type: 33,
  content_type_model: 'shared_elements.task',
  created_at: '2020-05-09T20:06:05.285432+02:00',
  created_by: mockUser,
  deleted: false,
  description: '',
  display: 'Test',
  due_date: '2020-05-09T23:59:59.999000+02:00',
  labels: [],
  last_modified_at: '2020-05-09T20:06:05.375517+02:00',
  last_modified_by: mockUser,
  metadata: [],
  pk: 'ca7f232b-63ce-4a4f-a7b2-5c7a654c3e9c',
  priority: 'NORM',
  projects: [],
  start_date: '2020-05-09T00:00:00+02:00',
  state: 'NEW',
  task_id: 12,
  title: 'Test',
  url: '',
  version_number: 0,
  full_day: false,
  is_favourite: false,
};

export const mockTasksList: DjangoAPI<Task[]> = {
  count: 1,
  next: null,
  previous: null,
  results: [mockTask],
};

export const mockKanbanTask: KanbanTask = {
  content_type: 45,
  content_type_model: 'kanban_boards.kanbanboardcolumntaskassignment',
  display: 'Task Test is assigned to column New column',
  kanban_board_column: '9069e47f-9476-4bb3-95f2-65a9a0326793',
  num_related_comments: 0,
  ordering: 0,
  pk: 'ff079b33-317a-455b-904c-5c25595b3f84',
  task: mockTask,
  task_id: 'ca7f232b-63ce-4a4f-a7b2-5c7a654c3e9c',
  url: 'http://workbench.local:8000/api/kanbanboards/470ddfdc-6180-4cb3-91b8-6b27a8b760fc/tasks/ff079b33-317a-455b-904c-5c25595b3f84/',
};

export const mockTaskVersion: Version = {
  summary: 'Test',
  display: 'Version 1 of Task 1',
  pk: '22a65503-50e8-4a16-83b7-81a576802545',
  content_type: 58,
  last_modified_at: '2019-07-31T12:23:30.836918+02:00',
  content_type_model: 'versions.version',
  content_type_pk: 33,
  metadata: {
    state: 'NEW',
    title: 'Task 1',
    labels: [],
    due_date: null,
    metadata: [],
    priority: 'HIGH',
    projects: ['21f5caf4-c7cc-4e65-8912-6ff1ae5a2478'],
    checklist: [],
    start_date: null,
    description: '<p>Lorem ipsum dolor sit amet.</p>',
    assigned_users: [135],
    metadata_version: 1,
  },
  last_modified_by: mockUser,
  object_id: 'a8db13e3-1d30-4e93-b568-1b14728e4196',
  created_at: '2019-07-31T12:23:30.836878+02:00',
  created_by: mockUser,
  number: 1,
};

export const mockTaskHistory: DjangoAPI<RecentChanges[]> = {
  count: 1,
  next: null,
  previous: null,
  results: [
    {
      pk: '7a20340e-b1ac-46b5-871c-48f30e4a3ecb',
      user: mockUser,
      object_type: { id: 33, app_label: 'shared_elements', model: 'task' },
      object_uuid: 'ea9636db-2020-4326-8191-47a14142ba42',
      changeset_type: 'I',
      date: '2020-07-06T14:15:48.534094+02:00',
      change_records: [
        { field_name: 'assigned_users', old_value: null, new_value: '' },
        { field_name: 'checklist_items', old_value: null, new_value: '[]' },
        { field_name: 'deleted', old_value: null, new_value: 'False' },
        { field_name: 'description', old_value: null, new_value: '' },
        { field_name: 'due_date', old_value: null, new_value: '2020-05-09 23:59:59.999000+02:00' },
        { field_name: 'labels', old_value: null, new_value: '' },
        { field_name: 'metadata', old_value: null, new_value: '[]' },
        { field_name: 'priority', old_value: null, new_value: 'NORM' },
        { field_name: 'projects', old_value: null, new_value: '' },
        { field_name: 'start_date', old_value: null, new_value: '2020-05-09 00:00:00+02:00' },
        { field_name: 'state', old_value: null, new_value: 'NEW' },
        { field_name: 'title', old_value: null, new_value: 'Test' },
      ],
    },
  ],
};

export const mockTaskBoardAssignment: TaskBoardAssignment = {
  content_type: 45,
  content_type_model: 'kanban_boards.kanbanboardcolumntaskassignment',
  display: 'Task Super important test task is assigned to column New',
  kanban_board: {
    content_type: mockTask.content_type,
    content_type_model: mockTask.content_type_model,
    display: mockTask.display,
    pk: mockTask.pk,
    title: mockTask.title,
  },
  kanban_board_column: {
    color: mockTaskBoardColumn.color,
    content_type: mockTaskBoardColumn.content_type,
    content_type_model: mockTaskBoardColumn.content_type_model,
    display: mockTaskBoardColumn.display,
    icon: mockTaskBoardColumn.icon,
    ordering: mockTaskBoardColumn.ordering,
    pk: mockTaskBoardColumn.pk,
    title: mockTaskBoardColumn.title,
  },
  pk: 'cc797b88-88ec-4aab-87cb-49544be8f738',
  url: 'http://workbench.local:8000/api/kanbanboards/c39fdfd9-353f-4c62-a4e8-b81ac18977a7/tasks/cc797b88-88ec-4aab-87cb-49544be8f738/',
};
