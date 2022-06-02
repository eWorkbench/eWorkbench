/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type { DjangoAPI, Project, ProjectMember, Relation, RelationPayload } from '@eworkbench/types';
import { mockUser } from './user';

export const mockProject: Project = {
  pk: '415107a9-23e6-4f70-82b3-2fe5ea04eb3a',
  url: 'http://localhost:8000/api/projects/415107a9-23e6-4f70-82b3-2fe5ea04eb3a/',
  last_modified_at: '2020-07-06T08:14:35.983544+02:00',
  content_type: 18,
  notes: 'http://localhost:8000/api/notes/?project=415107a9-23e6-4f70-82b3-2fe5ea04eb3a',
  acls: 'http://localhost:8000/api/projects/415107a9-23e6-4f70-82b3-2fe5ea04eb3a/acls/',
  version_number: 1,
  project_state: 'INIT',
  name: 'Test Projekt',
  deleted: false,
  start_date: null,
  meetings: 'http://localhost:8000/api/meetings/?project=415107a9-23e6-4f70-82b3-2fe5ea04eb3a',
  metadata: [],
  current_users_project_permissions_list: [
    'dmp.add_dmp',
    'dmp.change_dmp',
    'dmp.delete_dmp',
    'dmp.restore_dmp',
    'dmp.trash_dmp',
    'dmp.view_dmp',
    'dmp.change_dmpformdata',
    'drives.add_drive',
    'drives.change_drive',
    'drives.change_project_drive',
    'drives.delete_drive',
    'drives.restore_drive',
    'drives.trash_drive',
    'drives.view_drive',
    'kanban_boards.add_kanbanboard',
    'kanban_boards.change_kanbanboard',
    'kanban_boards.change_project_kanbanboard',
    'kanban_boards.delete_kanbanboard',
    'kanban_boards.restore_kanbanboard',
    'kanban_boards.trash_kanbanboard',
    'kanban_boards.view_kanbanboard',
    'labbooks.add_labbook',
    'labbooks.change_labbook',
    'labbooks.change_project_labbook',
    'labbooks.delete_labbook',
    'labbooks.restore_labbook',
    'labbooks.trash_labbook',
    'labbooks.view_labbook',
    'labbooks.add_labbooksection',
    'pictures.add_picture',
    'pictures.change_picture',
    'pictures.change_project_picture',
    'pictures.delete_picture',
    'pictures.restore_picture',
    'pictures.trash_picture',
    'pictures.view_picture',
    'projects.add_project',
    'projects.change_parent_project',
    'projects.change_project',
    'projects.delete_project',
    'projects.restore_project',
    'projects.trash_project',
    'projects.view_project',
    'projects.add_projectroleuserassignment',
    'projects.change_projectroleuserassignment',
    'projects.delete_projectroleuserassignment',
    'projects.view_projectroleuserassignment',
    'projects.add_resource',
    'projects.change_project_resource',
    'projects.change_resource',
    'projects.delete_resource',
    'projects.restore_resource',
    'projects.trash_resource',
    'projects.view_resource',
    'shared_elements.add_contact',
    'shared_elements.change_contact',
    'shared_elements.change_project_contact',
    'shared_elements.delete_contact',
    'shared_elements.restore_contact',
    'shared_elements.trash_contact',
    'shared_elements.view_contact',
    'shared_elements.add_contactattendsmeeting',
    'shared_elements.change_contactattendsmeeting',
    'shared_elements.delete_contactattendsmeeting',
    'shared_elements.view_contactattendsmeeting',
    'shared_elements.add_file',
    'shared_elements.change_file',
    'shared_elements.change_project_file',
    'shared_elements.delete_file',
    'shared_elements.restore_file',
    'shared_elements.trash_file',
    'shared_elements.view_file',
    'shared_elements.add_meeting',
    'shared_elements.change_meeting',
    'shared_elements.change_project_meeting',
    'shared_elements.delete_meeting',
    'shared_elements.restore_meeting',
    'shared_elements.trash_meeting',
    'shared_elements.view_meeting',
    'shared_elements.add_note',
    'shared_elements.change_note',
    'shared_elements.change_project_note',
    'shared_elements.delete_note',
    'shared_elements.restore_note',
    'shared_elements.trash_note',
    'shared_elements.view_note',
    'shared_elements.add_task',
    'shared_elements.change_project_task',
    'shared_elements.change_task',
    'shared_elements.delete_task',
    'shared_elements.restore_task',
    'shared_elements.trash_task',
    'shared_elements.view_task',
    'shared_elements.add_userattendsmeeting',
    'shared_elements.change_userattendsmeeting',
    'shared_elements.delete_userattendsmeeting',
    'shared_elements.view_userattendsmeeting',
  ],
  display: 'Test Projekt',
  description: '<p>Neue Description</p>',
  dmps: 'http://localhost:8000/api/dmps/?project=415107a9-23e6-4f70-82b3-2fe5ea04eb3a',
  last_modified_by: mockUser,
  created_at: '2020-06-25T14:28:14.345571+02:00',
  breadcrumbs: 'http://localhost:8000/api/projects/415107a9-23e6-4f70-82b3-2fe5ea04eb3a/breadcrumbs/',
  stop_date: null,
  created_by: mockUser,
  parent_project: null,
  content_type_model: 'projects.project',
  resources: 'http://localhost:8000/api/resources/?project=415107a9-23e6-4f70-82b3-2fe5ea04eb3a',
  tasks_status: { NEW: 0, PROG: 0, DONE: 0 },
  tasks: 'http://localhost:8000/api/tasks/?project=415107a9-23e6-4f70-82b3-2fe5ea04eb3a',
  history: 'http://localhost:8000/api/projects/415107a9-23e6-4f70-82b3-2fe5ea04eb3a/history/',
  project_tree: [{ pk: '415107a9-23e6-4f70-82b3-2fe5ea04eb3a', name: 'Test Projekt', parent_project: null }],
  files: 'http://localhost:8000/api/files/?project=415107a9-23e6-4f70-82b3-2fe5ea04eb3a',
  contacts: 'http://localhost:8000/api/contacts/?project=415107a9-23e6-4f70-82b3-2fe5ea04eb3a',
  is_favourite: false,
};

export const mockProjectsList: DjangoAPI<Project[]> = {
  count: 1,
  next: null,
  previous: null,
  results: [mockProject],
};

export const mockProjectMember: ProjectMember = {
  display: 'Michael Pölzl is assigned to project Test with role Project Manager',
  pk: 'f2b949c6-082f-42e6-b209-da858b9e1be3',
  project: '82d2c101-a39b-4e05-a10c-c9d47f307c6c',
  content_type_model: 'projects.projectroleuserassignment',
  url: 'http://localhost:8000/api/projects/82d2c101-a39b-4e05-a10c-c9d47f307c6c/acls/f2b949c6-082f-42e6-b209-da858b9e1be3/',
  role: {
    pk: '5b488d4b-2902-4731-8cc1-a7437b7a6c7e',
    name: 'Project Manager',
    default_role_on_project_create: true,
    default_role_on_project_user_assign: false,
  },
  last_modified_at: '2020-10-19T09:37:32.635289+02:00',
  created_at: '2020-09-07T17:09:38.858165+02:00',
  user: mockUser,
  last_modified_by: mockUser,
  created_by: mockUser,
  user_pk: 150,
  role_pk: '5b488d4b-2902-4731-8cc1-a7437b7a6c7e',
  content_type: 22,
};

export const mockProjectRelationPayload: RelationPayload = {
  right_content_type: 18,
  right_object_id: '82d2c101-a39b-4e05-a10c-c9d47f307c6c',
  left_content_type: 33,
  left_object_id: '2b546736-dc55-4b55-9091-01da70fa67fe',
};

export const mockProjectRelation: Relation = {
  display: 'Left object id 2b546736-dc55-4b55-9091-01da70fa67fe, right object id 82d2c101-a39b-4e05-a10c-c9d47f307c6c',
  pk: '7b1a7165-6872-4c75-9d1b-649d460b678b',
  private: true,
  content_type_model: 'relations.relation',
  right_object_id: '82d2c101-a39b-4e05-a10c-c9d47f307c6c',
  right_content_type_model: 'projects.project',
  left_object_id: '2b546736-dc55-4b55-9091-01da70fa67fe',
  last_modified_at: '2020-11-17T16:16:44.330304+01:00',
  right_content_type: 18,
  created_at: '2020-11-17T16:16:44.330234+01:00',
  right_content_object: {
    resources: 'http://localhost:8000/api/resources/?project=82d2c101-a39b-4e05-a10c-c9d47f307c6c',
    url: 'http://localhost:8000/api/projects/82d2c101-a39b-4e05-a10c-c9d47f307c6c/',
    meetings: 'http://localhost:8000/api/meetings/?project=82d2c101-a39b-4e05-a10c-c9d47f307c6c',
    version_number: 0,
    content_type: 18,
    name: 'Test',
    description: '',
    breadcrumbs: 'http://localhost:8000/api/projects/82d2c101-a39b-4e05-a10c-c9d47f307c6c/breadcrumbs/',
    current_users_project_permissions_list: [
      'dmp.view_dmp',
      'dmp.view_dmp_form_data',
      'drives.view_drive',
      'kanban_boards.view_kanbanboard',
      'labbooks.view_labbook',
      'pictures.view_picture',
      'projects.view_project',
      'projects.view_projectroleuserassignment',
      'projects.view_resource',
      'shared_elements.view_contact',
      'shared_elements.view_contactattendsmeeting',
      'shared_elements.view_file',
      'shared_elements.view_meeting',
      'shared_elements.add_note',
      'shared_elements.view_note',
      'shared_elements.view_task',
      'shared_elements.view_userattendsmeeting',
    ],
    acls: 'http://localhost:8000/api/projects/82d2c101-a39b-4e05-a10c-c9d47f307c6c/acls/',
    stop_date: null,
    start_date: null,
    last_modified_by: mockUser,
    tasks_status: { NEW: 0, PROG: 0, DONE: 0 },
    project_state: 'INIT',
    created_at: '2020-05-09T20:27:30.022788+02:00',
    deleted: false,
    display: 'Test',
    pk: '82d2c101-a39b-4e05-a10c-c9d47f307c6c',
    files: 'http://localhost:8000/api/files/?project=82d2c101-a39b-4e05-a10c-c9d47f307c6c',
    content_type_model: 'projects.project',
    history: 'http://localhost:8000/api/projects/82d2c101-a39b-4e05-a10c-c9d47f307c6c/history/',
    dmps: 'http://localhost:8000/api/dmps/?project=82d2c101-a39b-4e05-a10c-c9d47f307c6c',
    last_modified_at: '2020-09-08T10:45:40.498445+02:00',
    notes: 'http://localhost:8000/api/notes/?project=82d2c101-a39b-4e05-a10c-c9d47f307c6c',
    project_tree: [{ pk: '82d2c101-a39b-4e05-a10c-c9d47f307c6c', name: 'Test', parent_project: null }],
    created_by: mockUser,
    contacts: 'http://localhost:8000/api/contacts/?project=82d2c101-a39b-4e05-a10c-c9d47f307c6c',
    parent_project: null,
    tasks: 'http://localhost:8000/api/tasks/?project=82d2c101-a39b-4e05-a10c-c9d47f307c6c',
  },
  left_content_type: 33,
  last_modified_by: mockUser,
  created_by: mockUser,
  left_content_object: {
    state: 'NEW',
    task_id: 174,
    url: 'http://localhost:8000/api/tasks/2b546736-dc55-4b55-9091-01da70fa67fe/',
    version_number: 1,
    title: 'Test Task for Test Project',
    content_type: 33,
    due_date: null,
    checklist_items: [],
    description: '',
    metadata: [],
    assigned_users: [],
    start_date: null,
    last_modified_by: mockUser,
    assigned_users_pk: [],
    labels: [],
    priority: '3',
    created_at: '2020-11-17T15:02:01.847785+01:00',
    deleted: false,
    display: 'Test Task for Test Project',
    pk: '2b546736-dc55-4b55-9091-01da70fa67fe',
    content_type_model: 'shared_elements.task',
    projects: ['c3298541-a3ab-4845-9f88-25ea10a28cb2'],
    last_modified_at: '2020-11-17T15:02:02.105379+01:00',
    created_by: mockUser,
    content_type_name: 'task',
    content_type_name_translated: 'Task',
    content_type_icon: 'fa fa-tasks',
  },
  left_content_type_model: 'shared_elements.task',
  content_type: 26,
  table_object: {
    state: 'NEW',
    task_id: 174,
    url: 'http://localhost:8000/api/tasks/2b546736-dc55-4b55-9091-01da70fa67fe/',
    version_number: 1,
    title: 'Test Task for Test Project',
    content_type: 33,
    due_date: null,
    checklist_items: [],
    description: '',
    metadata: [],
    assigned_users: [],
    start_date: null,
    last_modified_by: mockUser,
    assigned_users_pk: [],
    labels: [],
    priority: '3',
    created_at: '2020-11-17T15:02:01.847785+01:00',
    deleted: false,
    display: 'Test Task for Test Project',
    pk: '2b546736-dc55-4b55-9091-01da70fa67fe',
    content_type_model: 'shared_elements.task',
    projects: ['c3298541-a3ab-4845-9f88-25ea10a28cb2'],
    last_modified_at: '2020-11-17T15:02:02.105379+01:00',
    created_by: mockUser,
    content_type_name: 'task',
    content_type_name_translated: 'Task',
    content_type_icon: 'fa fa-tasks',
  },
};
