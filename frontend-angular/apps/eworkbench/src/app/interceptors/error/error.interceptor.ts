/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@app/services';
import { TranslocoService } from '@ngneat/transloco';
import { ToastrService } from 'ngx-toastr';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  public constructor(
    private readonly authService: AuthService,
    private readonly toastrService: ToastrService,
    private readonly translocoService: TranslocoService,
    private readonly router: Router
  ) {}

  public intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        /* istanbul ignore next */
        if (error.status === 401) {
          this.authService.logout();
          location.reload();
        } else if (error.status === 403) {
          this.translocoService.selectTranslateObject('errorInterceptor.toastr.error.notAllowed').subscribe(notAllowed => {
            this.toastrService.error(notAllowed.body, notAllowed.header);
          });
        } else if (error.status === 500) {
          this.translocoService
            .selectTranslateObject('errorInterceptor.toastr.error.internalServerError')
            .subscribe(internalServerError => {
              this.toastrService.error(internalServerError.body, internalServerError.header);
            });
        } else if (![200, 404, 504].includes(error.status)) {
          // TODO: Remove status 504 as soon as these issues have been resolved. As per request by Mr. Kallenborn.
          const errors = error.error;
          this.translocoService.selectTranslate('errorInterceptor.error').subscribe(errorLabel => {
            for (const errorField of Object.keys(errors)) {
              this.toastrService.error(
                `${errorField}: ${errors[errorField] as string}`,
                `${errorLabel as string} ${error.status}: ${error.statusText}`
              );
            }
          });
        }

        return throwError(error);
      })
    );
  }
}
