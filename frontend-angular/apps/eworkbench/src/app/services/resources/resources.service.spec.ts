/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpParams } from '@angular/common/http';
import {
  mockExportLink,
  mockPrivileges,
  mockPrivilegesApi,
  mockResource,
  mockResourceHistory,
  mockResourcePayload,
  mockResourcesList,
} from '@eworkbench/mocks';
import { createHttpFactory, HttpMethod, mockProvider, SpectatorHttp } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { ResourcesService } from './resources.service';

const pk = '185cdf73-57d3-442e-b778-7ccba9a54b4e';
const userId = 1;

describe('ResourcesService', () => {
  let spectator: SpectatorHttp<ResourcesService>;
  const createService = createHttpFactory({
    service: ResourcesService,
    providers: [
      mockProvider(ResourcesService, {
        getList: () => of(mockResourcesList),
        add: () => of(mockResource),
        get: () => of({ privileges: mockPrivileges, data: mockResource }),
        patch: () => of(mockResource),
        restore: () => of(mockResource),
        history: () => of(mockResourceHistory),
        export: () => of(mockExportLink),
        getPrivilegesList: () => of([mockPrivilegesApi]),
        getUserPrivileges: () => of(mockPrivileges),
        addUserPrivileges: () => of(mockPrivilegesApi),
        putUserPrivileges: () => of(mockPrivileges),
        deleteUserPrivileges: () => of([mockPrivilegesApi]),
        changeTermsOfUsePDF: () => of(mockResource),
      }),
    ],
  });

  beforeEach(() => (spectator = createService()));

  it('should be created', () => {
    expect(spectator).toBeTruthy();
  });

  it('should call getList()', () => {
    const getListSpy = jest.spyOn(spectator.service, 'getList');
    spectator.service.getList();
    expect(getListSpy).toHaveBeenCalledTimes(1);
  });

  it('should add a new resource', () => {
    spectator.service.add(mockResourcePayload).subscribe(val => expect(val).toEqual(mockResource));
    spectator.expectOne(spectator.service.apiUrl, HttpMethod.POST);
  });

  it('should get data with HttpParams', () => {
    const params = new HttpParams().set('test', 'true');
    spectator.service.getList(params).subscribe(data => {
      expect(data).toEqual(mockResource);
    });
    spectator.expectOne(`${spectator.service.apiUrl}?${params.toString()}`, HttpMethod.GET);
  });

  it('should get data without HttpParams', () => {
    spectator.service.getList().subscribe(data => {
      expect(data).toEqual(mockResource);
    });
    spectator.expectOne(spectator.service.apiUrl, HttpMethod.GET);
  });

  it('should search data with HttpParams', () => {
    const search = 'random';
    const params = new HttpParams().set('test', 'true');
    spectator.service.search(search, params).subscribe(data => {
      expect(data).toEqual([mockResource]);
    });
    spectator.expectOne(`${spectator.service.apiUrl}?${params.toString()}&search=${search}`, HttpMethod.GET);
  });

  it('should search data without HttpParams', () => {
    const search = 'random';
    spectator.service.search(search).subscribe(data => {
      expect(data).toEqual([mockResource]);
    });
    spectator.expectOne(`${spectator.service.apiUrl}?search=${search}`, HttpMethod.GET);
  });

  it('should get resource details', () => {
    spectator.service.get(pk, userId).subscribe(data => {
      expect(data).toEqual(mockResource);
    });
    spectator.expectOne(`${spectator.service.apiUrl}${pk}/`, HttpMethod.GET);
  });

  it('should get privileges for users', () => {
    spectator.service.getPrivilegesList(pk).subscribe(data => {
      expect(data).toEqual([mockPrivilegesApi]);
    });
    spectator.expectOne(`${spectator.service.apiUrl}${pk}/privileges/`, HttpMethod.GET);
  });

  it('should get privileges for a single user', () => {
    spectator.service.getUserPrivileges(pk, userId, mockResource.deleted).subscribe(data => {
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

  it('should delete a resource', () => {
    spectator.service.delete(pk).subscribe(data => {
      expect(data).toEqual(mockResource);
    });
    spectator.expectOne(`${spectator.service.apiUrl}${pk}/soft_delete/`, HttpMethod.PATCH);
  });

  it('should patch a resource', () => {
    spectator.service.patch(pk, mockResourcePayload).subscribe(val => expect(val).toEqual(mockResource));
    spectator.expectOne(`${spectator.service.apiUrl}${pk}/`, HttpMethod.PATCH);
  });

  it('should restore a resource', () => {
    spectator.service.restore(pk).subscribe(data => {
      expect(data).toEqual(mockResource);
    });
    spectator.expectOne(`${spectator.service.apiUrl}${pk}/restore/`, HttpMethod.PATCH);
  });

  it('should get history with HttpParams', () => {
    const params = new HttpParams().set('test', 'true');
    spectator.service.history(pk, params).subscribe(data => {
      expect(data).toEqual(mockResourceHistory);
    });
    spectator.expectOne(`${spectator.service.apiUrl}${pk}/history/?${params.toString()}`, HttpMethod.GET);
  });

  it('should get history without HttpParams', () => {
    spectator.service.history(pk).subscribe(data => {
      expect(data).toEqual(mockResourceHistory);
    });
    spectator.expectOne(`${spectator.service.apiUrl}${pk}/history/`, HttpMethod.GET);
  });

  it('should get export link', () => {
    spectator.service.export(pk).subscribe(data => {
      expect(data).toEqual(mockExportLink);
    });
    spectator.expectOne(`${spectator.service.apiUrl}${pk}/get_export_link/`, HttpMethod.GET);
  });

  it('should lock a resource', () => {
    spectator.service.lock(pk).subscribe();
    spectator.expectOne(`${spectator.service.apiUrl}${pk}/lock/`, HttpMethod.POST);
  });

  it('should unlock a resource', () => {
    spectator.service.unlock(pk).subscribe();
    spectator.expectOne(`${spectator.service.apiUrl}${pk}/unlock/`, HttpMethod.POST);
  });

  it('should change the terms of use PDF file', () => {
    spectator.service.changeTermsOfUsePDF(pk, {}).subscribe(data => expect(data).toEqual(mockResource));
    spectator.expectOne(`${spectator.service.apiUrl}${pk}/`, HttpMethod.PATCH);
  });
});
