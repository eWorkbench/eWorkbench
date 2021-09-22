/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Role } from './role.interface';
import { User } from './user.interface';

export interface ProjectPayload {
  name: string;
  start_date: string | null;
  stop_date: string | null;
  project_state: 'INIT' | 'START' | 'FIN' | 'PAUSE' | 'CANCE' | 'DEL';
  description?: string;
  parent_project: string | null;
}

export interface ProjectMemberPayload {
  role: Role;
  role_pk: string;
  user_pk: number | string;
}

export interface ProjectMemberPatchPayload {
  pk: string;
  role_pk: string;
}

export interface ProjectTree {
  pk: string;
  name: string;
  parent_project: string | null;
}

export interface ProjectTaskStatus {
  NEW: number;
  PROG: number;
  DONE: number;
}

export interface Project {
  last_modified_at: string | null;
  content_type: number;
  last_modified_by: User;
  children?: Project[];
  created_at: string;
  content_type_model?: string;
  name: string;
  metadata: any[];
  version_number?: number;
  notes?: string;
  display: string;
  description?: string;
  dmps?: string;
  url?: string;
  deleted: boolean;
  created_by?: User;
  pk: string;
  acls: string;
  start_date: string | null;
  stop_date: string | null;
  meetings?: string;
  breadcrumbs: string;
  resources?: string;
  tasks?: string;
  history?: string;
  files?: string;
  contacts?: string;
  project_state: 'INIT' | 'START' | 'FIN' | 'PAUSE' | 'CANCE' | 'DEL';
  current_users_project_permissions_list: string[];
  project_tree: ProjectTree[];
  tasks_status: ProjectTaskStatus;
  parent_project: string | null;
  is_favourite: boolean;
}

export interface ProjectMember {
  content_type: number;
  content_type_model: string;
  created_at: string | null;
  created_by: User;
  display: string;
  last_modified_at: string | null;
  last_modified_by: User;
  pk: string;
  project: string;
  role: Role;
  role_pk: string;
  url: string;
  user: User;
  user_pk: number;
}
