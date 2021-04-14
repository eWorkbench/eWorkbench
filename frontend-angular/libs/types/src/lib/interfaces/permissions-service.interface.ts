/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Observable } from 'rxjs';
import { PrivilegesApi, Privileges } from './privileges.interface';

export interface PermissionsService {
  getPrivilegesList(id: string): Observable<PrivilegesApi[]>;
  getUserPrivileges(id: string, userId: number, deleted: boolean): Observable<Privileges>;
  addUserPrivileges(id: string, userId: number): Observable<PrivilegesApi>;
  putUserPrivileges(id: string, userId: number, privileges: PrivilegesApi): Observable<PrivilegesApi>;
  deleteUserPrivileges(id: string, userId: number): Observable<PrivilegesApi[]>;
}
