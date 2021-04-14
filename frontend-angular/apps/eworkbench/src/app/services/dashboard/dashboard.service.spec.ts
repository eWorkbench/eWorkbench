/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { mockDashboard } from '@eworkbench/mocks';
import { createHttpFactory, HttpMethod, mockProvider, SpectatorHttp } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { DashboardService } from './dashboard.service';

describe('DashboardService', () => {
  let spectator: SpectatorHttp<DashboardService>;
  const createService = createHttpFactory({
    service: DashboardService,
    providers: [
      mockProvider(DashboardService, {
        get: () => of(mockDashboard),
      }),
    ],
  });

  beforeEach(() => (spectator = createService()));

  it('should be created', () => {
    expect(spectator).toBeTruthy();
  });

  it('should get dashboard data', () => {
    spectator.service.get().subscribe(data => {
      expect(data).toEqual(mockDashboard);
    });
    spectator.expectOne(spectator.service.apiUrl, HttpMethod.GET);
  });
});
