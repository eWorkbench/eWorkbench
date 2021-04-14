/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpParams } from '@angular/common/http';
import {
  mockCalendarAccessPrivileges,
  mockCalendarAccessPrivilegesList,
  mockCalendarAccessPrivilegesPayload,
  mockPrivileges,
  mockPrivilegesApi,
} from '@eworkbench/mocks';
import { createHttpFactory, HttpMethod, mockProvider, SpectatorHttp } from '@ngneat/spectator';
import { of } from 'rxjs';
import { CalendarAccessPrivilegesService } from './calendar-access-privileges.service';

const pk = '185cdf73-57d3-442e-b778-7ccba9a54b4e';
const userId = 1;

describe('CalendarAccessPrivilegesService', () => {
  let spectator: SpectatorHttp<CalendarAccessPrivilegesService>;
  const createService = createHttpFactory({
    service: CalendarAccessPrivilegesService,
    providers: [
      mockProvider(CalendarAccessPrivilegesService, {
        getList: () => of(mockCalendarAccessPrivilegesList),
        add: () => of(mockCalendarAccessPrivileges),
        getPrivilegesList: () => of(),
        getUserPrivileges: () => of(mockPrivileges),
        addUserPrivileges: () => of(mockPrivilegesApi),
        putUserPrivileges: () => of(mockPrivileges),
        deleteUserPrivileges: () => of([mockPrivilegesApi]),
      }),
    ],
  });

  beforeEach(() => (spectator = createService()));

  it('should be created', () => {
    expect(spectator).toBeTruthy();
  });

  it('should call getList()', () => {
    const getListSpy = spyOn(spectator.service, 'getList').and.callThrough();
    spectator.service.getList();
    expect(getListSpy).toHaveBeenCalledTimes(1);
  });

  it('should add a new contact', () => {
    spectator.service.add(mockCalendarAccessPrivilegesPayload).subscribe(val => expect(val).toEqual(mockCalendarAccessPrivileges));
    spectator.expectOne(spectator.service.apiUrl, HttpMethod.POST);
  });

  it('should get data with HttpParams', () => {
    const params = new HttpParams().set('test', 'true');
    spectator.service.getList(params).subscribe(data => {
      expect(data).toEqual(mockCalendarAccessPrivileges);
    });
    spectator.expectOne(`${spectator.service.apiUrl}?${params.toString()}`, HttpMethod.GET);
  });

  it('should get data without HttpParams', () => {
    spectator.service.getList().subscribe(data => {
      expect(data).toEqual(mockCalendarAccessPrivileges);
    });
    spectator.expectOne(spectator.service.apiUrl, HttpMethod.GET);
  });

  it('should get privileges for users', () => {
    spectator.service.getPrivilegesList(pk).subscribe(data => {
      expect(data).toEqual([mockPrivilegesApi]);
    });
    spectator.expectOne(`${spectator.service.apiUrl}${pk}/privileges/`, HttpMethod.GET);
  });

  it('should get privileges for a single user', () => {
    spectator.service.getUserPrivileges(pk, userId, mockCalendarAccessPrivileges.deleted).subscribe(data => {
      expect(data).toEqual(mockPrivileges);
    });
    spectator.expectOne(`${spectator.service.apiUrl}${pk}/privileges/${userId}/`, HttpMethod.GET);
  });

  it('should add privileges for a user', () => {
    spectator.service.addUserPrivileges(pk, userId).subscribe(data => {
      expect(data).toEqual(mockPrivilegesApi);
    });
    spectator.expectOne(`${spectator.service.apiUrl}${pk}/privileges/?pk=${userId}`, HttpMethod.POST);
  });

  it('should put privileges for a user', () => {
    spectator.service.putUserPrivileges(pk, userId, mockPrivilegesApi).subscribe(data => {
      expect(data).toEqual(mockPrivilegesApi);
    });
    spectator.expectOne(`${spectator.service.apiUrl}${pk}/privileges/${userId}/`, HttpMethod.PUT);
  });

  it('should delete privileges for a user', () => {
    spectator.service.deleteUserPrivileges(pk, userId).subscribe(data => {
      expect(data).toEqual([mockPrivilegesApi]);
    });
    spectator.expectOne(`${spectator.service.apiUrl}${pk}/privileges/${userId}/`, HttpMethod.DELETE);
  });
});
