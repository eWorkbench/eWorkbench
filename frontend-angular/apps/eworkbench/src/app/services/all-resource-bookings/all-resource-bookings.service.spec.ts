/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpParams } from '@angular/common/http';
import { mockExportLink, mockResourceBooking, mockResourceBookingsList } from '@eworkbench/mocks';
import { createHttpFactory, HttpMethod, mockProvider, SpectatorHttp } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { AllResourceBookingsService } from './all-resource-bookings.service';

const pk = '185cdf73-57d3-442e-b778-7ccba9a54b4e';

describe('AllResourceBookingsService', () => {
  let spectator: SpectatorHttp<AllResourceBookingsService>;
  const createService = createHttpFactory({
    service: AllResourceBookingsService,
    providers: [
      mockProvider(AllResourceBookingsService, {
        getList: () => of(mockResourceBookingsList),
        delete: () => of(mockResourceBooking),
        export: () => of(mockExportLink),
        exportMany: () => of({}),
      }),
    ],
  });

  beforeEach(() => (spectator = createService()));

  it('should be created', () => {
    expect(spectator).toBeTruthy();
  });

  it('should get data with HttpParams', () => {
    const params = new HttpParams().set('test', 'true');
    spectator.service.getList(params).subscribe(data => {
      expect(data).toEqual(mockResourceBooking);
    });
    spectator.expectOne(`${spectator.service.apiUrl}?${params.toString()}`, HttpMethod.GET);
  });

  it('should get data without HttpParams', () => {
    spectator.service.getList().subscribe(data => {
      expect(data).toEqual(mockResourceBooking);
    });
    spectator.expectOne(spectator.service.apiUrl, HttpMethod.GET);
  });

  it('should delete a resource booking', () => {
    spectator.service.delete(pk).subscribe(data => {
      expect(data).toEqual(mockResourceBooking);
    });
    spectator.expectOne(`${spectator.service.apiUrl}${pk}/`, HttpMethod.PATCH);
  });

  it('should get export link', () => {
    spectator.service.export(pk).subscribe(data => {
      expect(data).toEqual(mockExportLink);
    });
    spectator.expectOne(`${spectator.service.apiUrl}${pk}/get_export_link/`, HttpMethod.GET);
  });

  it('should export many resource bookings', () => {
    spectator.service.exportMany([pk, pk]).subscribe();
    spectator.expectOne(`${spectator.service.apiUrl}export_many/${pk},${pk}/`, HttpMethod.GET);
  });
});
