/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Injectable } from '@angular/core';
import type { CanDeactivate } from '@angular/router';
import type { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PendingChangesGuard implements CanDeactivate<any> {
  public canDeactivate(component: any): Observable<boolean> {
    return component.pendingChanges();
  }
}
