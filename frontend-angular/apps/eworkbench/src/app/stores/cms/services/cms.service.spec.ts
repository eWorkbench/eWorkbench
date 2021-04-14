/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpClientModule } from '@angular/common/http';
import { mockCMSMaintenance } from '@eworkbench/mocks';
import { createHttpFactory, HttpMethod, mockProvider, SpectatorHttp } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { CMSService } from './cms.service';

describe('CMSService', () => {
  let spectator: SpectatorHttp<CMSService>;
  const createService = createHttpFactory({
    service: CMSService,
    imports: [HttpClientModule],
    providers: [
      mockProvider(CMSService, {
        maintenance: () => of(mockCMSMaintenance),
      }),
    ],
  });

  beforeEach(() => (spectator = createService()));

  it('should be created', () => {
    expect(spectator.service).toBeTruthy();
  });

  it('should get a maintenance notification', () => {
    spectator.service.maintenance().subscribe(val => expect(val).toEqual(mockCMSMaintenance));
    spectator.expectOne(`${spectator.service.apiUrl}json/maintenance/`, HttpMethod.GET);
  });
});
