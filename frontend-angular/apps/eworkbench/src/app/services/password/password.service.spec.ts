/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { mockChangePasswordPayload, mockForgotPasswordPayload, mockPasswordServiceResponse } from '@eworkbench/mocks';
import { createHttpFactory, HttpMethod, mockProvider, SpectatorHttp } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { PasswordService } from './password.service';

describe('PasswordService', () => {
  let spectator: SpectatorHttp<PasswordService>;
  const createService = createHttpFactory({
    service: PasswordService,
    providers: [
      mockProvider(PasswordService, {
        request: () => of(mockPasswordServiceResponse),
        confirm: () => of(mockPasswordServiceResponse),
      }),
    ],
  });

  beforeEach(() => (spectator = createService()));

  it('should be created', () => {
    expect(spectator.service).toBeTruthy();
  });

  it('should request a new password', () => {
    spectator.service.request(mockForgotPasswordPayload).subscribe(val => expect(val).toEqual(mockPasswordServiceResponse));
    spectator.expectOne(spectator.service.apiUrl, HttpMethod.POST);
  });

  it('should set a new password', () => {
    spectator.service.confirm(mockChangePasswordPayload).subscribe(val => expect(val).toEqual(mockPasswordServiceResponse));
    spectator.expectOne(`${spectator.service.apiUrl}confirm/`, HttpMethod.POST);
  });
});
