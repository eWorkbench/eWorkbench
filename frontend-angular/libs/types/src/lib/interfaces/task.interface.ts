/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Metadata } from './metadata.interface';
import { TaskBoardColumn } from './task-board-column.interface';
import { TaskBoard } from './task-board.interface';
import { TaskUser } from './task-user.interface';

export interface TaskPayload {
  assigned_users_pk: number[];
  checklist_items: TaskChecklist[];
  start_date: string | null;
  due_date: string | null;
  full_day: boolean;
  labels: string[];
  state: 'NEW' | 'PROG' | 'DONE';
  projects: string[];
  priority: 'VHIGH' | 'HIGH' | 'NORM' | 'LOW' | 'VLOW';
  title: string;
  description?: string;
  metadata?: Metadata[];
}

export interface TaskChecklist {
  ordering: number;
  checked: boolean;
  title: string;
  content_type?: number;
  content_type_model?: string;
  display?: string;
  pk?: string;
}

export interface Task {
  assigned_users: TaskUser[];
  assigned_users_pk: number[];
  checklist_items: TaskChecklist[];
  content_type: number;
  content_type_model: string;
  created_at: string;
  created_by: TaskUser;
  deleted: boolean;
  description: string;
  display: string;
  start_date: string | null;
  due_date: string | null;
  full_day: boolean;
  labels: string[];
  last_modified_at: string;
  last_modified_by: TaskUser;
  metadata: Metadata[];
  pk: string;
  state: 'NEW' | 'PROG' | 'DONE';
  projects: string[];
  priority: 'VHIGH' | 'HIGH' | 'NORM' | 'LOW' | 'VLOW';
  task_id: number;
  title: string;
  url: string;
  version_number: number;
  is_favourite: boolean;
}

export interface KanbanTask {
  content_type: number;
  content_type_model: string;
  display: string;
  kanban_board_column: string;
  num_related_comments?: number;
  num_relations?: number;
  ordering: number;
  pk: string;
  task: Task;
  task_id: string;
  url: string;
}

export interface TaskBoardAssignment {
  content_type: number;
  content_type_model: string;
  display: string;
  kanban_board: Pick<TaskBoard, 'content_type' | 'content_type_model' | 'display' | 'pk' | 'title'>;
  kanban_board_column: Pick<
    TaskBoardColumn,
    'color' | 'content_type' | 'content_type_model' | 'display' | 'icon' | 'ordering' | 'pk' | 'title'
  >;
  pk: string;
  url: string;
}
