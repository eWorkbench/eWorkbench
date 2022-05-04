/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { AuthService } from '@app/services';
import { UserService, UserState } from '@app/stores/user';
import { Observable, of } from 'rxjs';
import { map, switchMap, take } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  public constructor(
    private readonly router: Router,
    private readonly authService: AuthService,
    private readonly userService: UserService
  ) {}

  private navigate(user: boolean, state: RouterStateSnapshot): boolean {
    if (user) {
      return true;
    }

    void this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }

  public canActivate(_: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean | UrlTree> {
    return this.authService.user$.pipe(
      take(1),
      map((user: UserState) => user.loggedIn),
      switchMap((loggedIn: boolean) => {
        if (loggedIn) {
          return of(this.navigate(loggedIn, state));
        }

        const token = localStorage.getItem('token');

        if (token) {
          return this.userService.check(token).pipe(
            take(1),
            map((user: UserState) => this.navigate(user.loggedIn, state))
          );
        }

        return of(this.navigate(loggedIn, state));
      })
    );
  }
}
