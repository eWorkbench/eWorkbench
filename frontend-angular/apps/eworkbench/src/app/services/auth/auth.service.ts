/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Injectable } from '@angular/core';
import { UserService, UserState } from '@app/stores/user';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  public constructor(private readonly userService: UserService) {}

  public get user$(): Observable<UserState> {
    return this.userService.get$;
  }

  public login(username: string, password: string): Observable<UserState> {
    return this.userService.login(username, password);
  }

  public logout(): void {
    this.userService.logout();
  }
}
