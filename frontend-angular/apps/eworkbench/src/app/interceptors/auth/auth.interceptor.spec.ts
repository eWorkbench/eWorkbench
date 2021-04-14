/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpRequest, HttpResponse } from '@angular/common/http';
import { AuthService } from '@app/services';
import { environment } from '@environments/environment';
import { mockUserState } from '@eworkbench/mocks';
import { createHttpFactory, HttpMethod, mockProvider, SpectatorService } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { AuthInterceptor } from './auth.interceptor';

describe('AuthInterceptor', () => {
  let spectator: SpectatorService<AuthInterceptor>;
  const createService = createHttpFactory({
    service: AuthInterceptor,
    providers: [mockProvider(AuthService, { user$: of(mockUserState) })],
  });

  beforeEach(() => (spectator = createService()));

  it('should be created', () => {
    expect(spectator.service).toBeTruthy();
  });

  it('should attach an authorization header to every request', () => {
    spectator.service
      .intercept(new HttpRequest(HttpMethod.GET, environment.apiUrl), {
        handle: req => {
          expect(req.headers.get('Authorization')).toBe('Token sometoken');
          return of(new HttpResponse({ status: 200 }));
        },
      })
      .subscribe();
  });
});
