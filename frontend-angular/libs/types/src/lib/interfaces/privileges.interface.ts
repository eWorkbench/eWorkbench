/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type { User } from './user.interface';

export interface PrivilegesApi {
  content_type: number;
  content_type_model: string;
  content_type_pk: number;
  delete_privilege: 'AL' | 'DE' | 'NE';
  display: string;
  edit_privilege: 'AL' | 'DE' | 'NE';
  full_access_privilege: 'AL' | 'DE' | 'NE';
  object_id: string;
  pk?: string;
  restore_privilege: 'AL' | 'DE' | 'NE';
  trash_privilege: 'AL' | 'DE' | 'NE';
  user: User;
  user_pk: number;
  view_privilege: 'AL' | 'DE' | 'NE';
}

export interface Privileges {
  fullAccess: boolean;
  view: boolean;
  edit: boolean;
  delete: boolean;
  trash: boolean;
  restore: boolean;
}

export interface ProjectPrivileges {
  editRoles: boolean;
  deleteRoles: boolean;
  addRoles: boolean;
  viewRoles: boolean;
  inviteExternalUsers: boolean;
}

export interface PrivilegesData<T> {
  privileges: Privileges;
  data: T;
}
