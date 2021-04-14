/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanDeactivate, RouterStateSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LeaveProjectGuard implements CanDeactivate<any> {
  public canDeactivate(
    component: any,
    _: ActivatedRouteSnapshot,
    __: RouterStateSnapshot,
    nextState: RouterStateSnapshot
  ): Observable<boolean> {
    if (nextState.url.includes('/projects/')) {
      return of(true);
    }

    return component.canDeactivate();
  }
}
