/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthService } from '@app/services';
import type { UserState } from '@app/stores/user';
import { environment } from '@environments/environment';
import type { Observable } from 'rxjs';
import { map, switchMap, take } from 'rxjs/operators';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  public constructor(private readonly authService: AuthService) {}

  public intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return this.authService.user$.pipe(
      take(1),
      map((state: UserState) => {
        const isAPIURL = request.url.startsWith(environment.apiUrl);
        /* istanbul ignore else */
        if (state.loggedIn && isAPIURL) {
          request = request.clone({
            setHeaders: {
              Authorization: `Token ${state.token!}`,
            },
          });
        }

        return request;
      }),
      switchMap(() => next.handle(request))
    );
  }
}
