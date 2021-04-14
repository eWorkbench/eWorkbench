/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { mockAppointment, mockExportLink } from '@eworkbench/mocks';
import { createHttpFactory, HttpMethod, mockProvider, SpectatorHttp } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { MyScheduleService } from './my-schedule.service';

describe('MyScheduleService', () => {
  let spectator: SpectatorHttp<MyScheduleService>;
  const createService = createHttpFactory({
    service: MyScheduleService,
    providers: [
      mockProvider(MyScheduleService, {
        getList: () => of([mockAppointment]),
        export: () => of(mockExportLink),
      }),
    ],
  });

  beforeEach(() => (spectator = createService()));

  it('should be created', () => {
    expect(spectator).toBeTruthy();
  });

  it('should get schedules data', () => {
    spectator.service.getList().subscribe(val => expect(val).toEqual([mockAppointment]));
    spectator.expectOne(spectator.service.apiUrl, HttpMethod.GET);
  });

  it('should get the export link', () => {
    spectator.service.export().subscribe(val => expect(val).toEqual(mockExportLink));
    spectator.expectOne(`${spectator.service.apiUrl}get_export_link/`, HttpMethod.GET);
  });
});
