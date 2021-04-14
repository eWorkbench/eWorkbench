/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { mockDMPForm } from '@eworkbench/mocks';
import { createHttpFactory, HttpMethod, mockProvider, SpectatorHttp } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { DMPFormsService } from './dmp-forms.service';

const pk = '185cdf73-57d3-442e-b778-7ccba9a54b4e';

describe('DMPFormsService', () => {
  let spectator: SpectatorHttp<DMPFormsService>;
  const createService = createHttpFactory({
    service: DMPFormsService,
    providers: [
      mockProvider(DMPFormsService, {
        get: () => of([mockDMPForm]),
      }),
    ],
  });

  beforeEach(() => (spectator = createService()));

  it('should be created', () => {
    expect(spectator).toBeTruthy();
  });

  it('should get data', () => {
    spectator.service.getList().subscribe(data => {
      expect(data).toEqual([mockDMPForm]);
    });
    spectator.expectOne(spectator.service.apiUrl, HttpMethod.GET);
  });

  it('should get a DMP form', () => {
    spectator.service.get(pk).subscribe(data => {
      expect(data).toEqual(mockDMPForm);
    });
    spectator.expectOne(`${spectator.service.apiUrl}${pk}/`, HttpMethod.GET);
  });
});
