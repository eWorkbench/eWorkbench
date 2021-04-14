/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpParams } from '@angular/common/http';
import { mockAppointment } from '@eworkbench/mocks';
import { createHttpFactory, HttpMethod, mockProvider, SpectatorHttp } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { ResourceBookingsService } from './resource-bookings.service';

const id = '77990bc0-823e-4493-bc3e-72d6794ffd87';
const endDate = new Date().toISOString();

describe('ResourceBookingsService', () => {
  let spectator: SpectatorHttp<ResourceBookingsService>;
  const createService = createHttpFactory({
    service: ResourceBookingsService,
    providers: [
      mockProvider(ResourceBookingsService, {
        getAll: () => of([mockAppointment]),
        getMine: () => of([mockAppointment]),
      }),
    ],
  });

  beforeEach(() => (spectator = createService()));

  it('should be created', () => {
    expect(spectator).toBeTruthy();
  });

  it('should get all appointments', () => {
    const params = new HttpParams().set('resource', id.toString());
    spectator.service.getAll(id).subscribe(val => expect(val).toEqual([mockAppointment]));
    spectator.expectOne(`${spectator.service.apiUrl}all/?${params.toString()}`, HttpMethod.GET);
  });

  it('should get my appointments', () => {
    const params = new HttpParams()
      .set('resource', id.toString())
      .set('end_date__gt', endDate)
      .set('ordering', 'attending_users')
      .set('limit', '10')
      .set('offset', '0');
    spectator.service.getMine(id, endDate).subscribe(val => expect(val).toEqual([mockAppointment]));
    spectator.expectOne(`${spectator.service.apiUrl}my/?${params.toString()}`, HttpMethod.GET);
  });
});
