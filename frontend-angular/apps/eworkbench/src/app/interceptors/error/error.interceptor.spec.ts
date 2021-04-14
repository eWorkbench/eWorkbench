/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpErrorResponse, HttpRequest } from '@angular/common/http';
import { RouterTestingModule } from '@angular/router/testing';
import { AuthService } from '@app/services';
import { getTranslocoModule } from '@app/transloco-testing.module';
import { environment } from '@environments/environment';
import { createHttpFactory, HttpMethod, SpectatorService } from '@ngneat/spectator/jest';
import { ToastrModule, ToastrService } from 'ngx-toastr';
import { throwError } from 'rxjs';
import { ErrorInterceptor } from './error.interceptor';

const mockHttpErrors = {
  error: {
    field_name_1: ['Error message 1'],
    field_name_2: ['Error message 2'],
  },
};

describe('ErrorInterceptor', () => {
  let spectator: SpectatorService<ErrorInterceptor>;
  const createService = createHttpFactory({
    service: ErrorInterceptor,
    imports: [ToastrModule.forRoot(), getTranslocoModule(), RouterTestingModule],
    mocks: [AuthService, ToastrService],
  });

  beforeEach(() => (spectator = createService()));

  beforeEach(() => {
    // @ts-ignore
    delete window.location;
    window.location = {
      ancestorOrigins: {
        length: 0,
        contains: jest.fn(),
        item: jest.fn(),
      },
      hash: '',
      href: '',
      host: '',
      hostname: '',
      origin: '',
      pathname: '',
      port: '',
      protocol: '',
      search: '',
      assign: jest.fn(),
      reload: jest.fn(),
      replace: jest.fn(),
    };
  });

  it('should be created', () => {
    expect(spectator.service).toBeTruthy();
  });

  it('should intercept and throw error on any non-200', () => {
    [200, 400, 401, 403, 500].forEach(status => {
      spectator.service
        .intercept(new HttpRequest(HttpMethod.GET, environment.apiUrl), {
          handle: () => throwError(new HttpErrorResponse({ status, error: mockHttpErrors })),
        })
        .subscribe(
          () => {},
          (error: HttpErrorResponse) => {
            expect(error.status).toBe(status);
            expect(error.error).toBe(mockHttpErrors);
          }
        );
    });
  });
});
