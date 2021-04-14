/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { mockSitePreferences } from '@eworkbench/mocks';
import { createHttpFactory, HttpMethod, mockProvider, SpectatorHttp } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { SitePreferencesService } from './site-preferences.service';

describe('SitePreferencesService', () => {
  let spectator: SpectatorHttp<SitePreferencesService>;
  const createService = createHttpFactory({
    service: SitePreferencesService,
    providers: [
      mockProvider(SitePreferencesService, {
        get: () => of(mockSitePreferences),
      }),
    ],
  });

  beforeEach(() => (spectator = createService()));

  it('should be created', () => {
    expect(spectator).toBeTruthy();
  });

  it('should get site preferences', () => {
    const getSpy = spyOn(spectator.service, 'get').and.callThrough();
    spectator.service.get().subscribe(sitePreferences => expect(sitePreferences).toEqual(mockSitePreferences));
    expect(getSpy).toHaveBeenCalledTimes(1);
    spectator.expectOne(spectator.service.apiUrl, HttpMethod.GET);
  });
});
