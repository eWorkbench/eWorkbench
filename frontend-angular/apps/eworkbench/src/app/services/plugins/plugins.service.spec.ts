/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpParams } from '@angular/common/http';
import { mockPluginDetails, mockPluginFeedbackPayload } from '@eworkbench/mocks';
import { createHttpFactory, HttpMethod, mockProvider, SpectatorHttp } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { PluginsService } from './plugins.service';

describe('PluginsService', () => {
  let spectator: SpectatorHttp<PluginsService>;
  const createService = createHttpFactory({
    service: PluginsService,
    providers: [
      mockProvider(PluginsService, {
        get: () => of(mockPluginDetails),
        feedback: () => of(mockPluginFeedbackPayload),
      }),
    ],
  });

  beforeEach(() => (spectator = createService()));

  it('should be created', () => {
    expect(spectator).toBeTruthy();
  });

  it('should get data with HttpParams', () => {
    const params = new HttpParams().set('test', 'true');
    spectator.service.get(params).subscribe(data => {
      expect(data).toEqual(mockPluginDetails);
    });
    spectator.expectOne(`${spectator.service.apiUrl}?${params.toString()}`, HttpMethod.GET);
  });

  it('should get data without HttpParams', () => {
    spectator.service.get().subscribe(data => {
      expect(data).toEqual(mockPluginDetails);
    });
    spectator.expectOne(spectator.service.apiUrl, HttpMethod.GET);
  });

  it('should post a new feedback', () => {
    spectator.service.feedback(mockPluginFeedbackPayload).subscribe();
    spectator.expectOne(`${spectator.service.apiUrl}feedback/`, HttpMethod.POST);
  });
});
