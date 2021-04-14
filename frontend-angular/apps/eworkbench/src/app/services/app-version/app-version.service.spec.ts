/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { mockAppVersion } from '@eworkbench/mocks';
import { createHttpFactory, HttpMethod, mockProvider, SpectatorHttp } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { AppVersionService } from './app-version.service';

describe('AppVersionService', () => {
  let spectator: SpectatorHttp<AppVersionService>;
  const createService = createHttpFactory({
    service: AppVersionService,
    providers: [
      mockProvider(AppVersionService, {
        get: () => of(mockAppVersion),
      }),
    ],
  });

  beforeEach(() => (spectator = createService()));

  it('should be created', () => {
    expect(spectator).toBeTruthy();
  });

  it('should send a message', () => {
    spectator.service.get().subscribe(data => {
      expect(data).toEqual(mockAppVersion);
    });
    spectator.expectOne(spectator.service.apiUrl, HttpMethod.GET);
  });
});
