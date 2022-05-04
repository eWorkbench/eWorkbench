/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Injectable } from '@angular/core';
import type { Privileges, PrivilegesApi } from '@eworkbench/types';

@Injectable({
  providedIn: 'root',
})
export class PrivilegesService {
  public transform(privileges: PrivilegesApi, deleted: boolean): Privileges {
    // TODO: if this is a project, we can check the current users project permission list
    // if (obj.content_type_model == 'projects.project') {
    //   return obj.current_users_project_permissions_list.indexOf('projects.trash_project') >= 0;
    // }

    return {
      fullAccess: privileges.full_access_privilege === 'AL',
      view: privileges.full_access_privilege === 'AL' || privileges.view_privilege === 'AL',
      edit: deleted ? false : privileges.full_access_privilege === 'AL' || privileges.edit_privilege === 'AL',
      delete: deleted ? false : privileges.full_access_privilege === 'AL' || privileges.delete_privilege === 'AL',
      trash: deleted ? false : privileges.full_access_privilege === 'AL' || privileges.trash_privilege === 'AL',
      restore: deleted ? true : privileges.full_access_privilege === 'AL' || privileges.restore_privilege === 'AL',
    };
  }
}
