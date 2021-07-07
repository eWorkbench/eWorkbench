/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpParams } from '@angular/common/http';
import {
  mockDMP,
  mockDMPHistory,
  mockDMPPayload,
  mockDMPsList,
  mockDMPVersion,
  mockExportLink,
  mockPrivileges,
  mockPrivilegesApi,
} from '@eworkbench/mocks';
import { createHttpFactory, HttpMethod, mockProvider, SpectatorHttp } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { DMPService } from './dmp.service';

const pk = '185cdf73-57d3-442e-b778-7ccba9a54b4e';
const userId = 1;
const version = '09e98b46-2ebf-4c27-9240-1b240ff5987e';

describe('DMPService', () => {
  let spectator: SpectatorHttp<DMPService>;
  const createService = createHttpFactory({
    service: DMPService,
    providers: [
      mockProvider(DMPService, {
        getList: () => of(mockDMPsList),
        add: () => of(mockDMP),
        get: () => of({ privileges: mockPrivileges, data: mockDMP }),
        patch: () => of(mockDMP),
        restore: () => of(mockDMP),
        history: () => of(mockDMPHistory),
        versions: () => of([mockDMPVersion]),
        previewVersion: () => of(mockDMPVersion),
        addVersion: () => of(mockDMP),
        restoreVersion: () => of(mockDMP),
        export: () => of(mockExportLink),
        exportAsType: () => of({}),
        getPrivilegesList: () => of([mockPrivilegesApi]),
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
    const getListSpy = jest.spyOn(spectator.service, 'getList');
    spectator.service.getList();
    expect(getListSpy).toHaveBeenCalledTimes(1);
  });

  it('should add a new DMP', () => {
    spectator.service.add(mockDMPPayload).subscribe(val => expect(val).toEqual(mockDMP));
    spectator.expectOne(spectator.service.apiUrl, HttpMethod.POST);
  });

  it('should get data with HttpParams', () => {
    const params = new HttpParams().set('test', 'true');
    spectator.service.getList(params).subscribe(data => {
      expect(data).toEqual(mockDMP);
    });
    spectator.expectOne(`${spectator.service.apiUrl}?${params.toString()}`, HttpMethod.GET);
  });

  it('should get data without HttpParams', () => {
    spectator.service.getList().subscribe(data => {
      expect(data).toEqual(mockDMP);
    });
    spectator.expectOne(spectator.service.apiUrl, HttpMethod.GET);
  });

  it('should get DMP details', () => {
    spectator.service.get(pk, userId).subscribe(data => {
      expect(data).toEqual(mockDMP);
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
    spectator.service.getUserPrivileges(pk, userId, mockDMP.deleted).subscribe(data => {
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

  it('should delete a DMP', () => {
    spectator.service.delete(pk).subscribe(data => {
      expect(data).toEqual(mockDMP);
    });
    spectator.expectOne(`${spectator.service.apiUrl}${pk}/soft_delete/`, HttpMethod.PATCH);
  });

  it('should patch a DMP', () => {
    spectator.service.patch(pk, mockDMPPayload).subscribe(val => expect(val).toEqual(mockDMP));
    spectator.expectOne(`${spectator.service.apiUrl}${pk}/`, HttpMethod.PATCH);
  });

  it('should restore a DMP', () => {
    spectator.service.restore(pk).subscribe(data => {
      expect(data).toEqual(mockDMP);
    });
    spectator.expectOne(`${spectator.service.apiUrl}${pk}/restore/`, HttpMethod.PATCH);
  });

  it('should get history with HttpParams', () => {
    const params = new HttpParams().set('test', 'true');
    spectator.service.history(pk, params).subscribe(data => {
      expect(data).toEqual(mockDMPHistory);
    });
    spectator.expectOne(`${spectator.service.apiUrl}${pk}/history/?${params.toString()}`, HttpMethod.GET);
  });

  it('should get history without HttpParams', () => {
    spectator.service.history(pk).subscribe(data => {
      expect(data).toEqual(mockDMPHistory);
    });
    spectator.expectOne(`${spectator.service.apiUrl}${pk}/history/`, HttpMethod.GET);
  });

  it('should get versions with HttpParams', () => {
    const params = new HttpParams().set('test', 'true');
    spectator.service.versions(pk, params).subscribe(data => {
      expect(data).toEqual([mockDMPVersion]);
    });
    spectator.expectOne(`${spectator.service.apiUrl}${pk}/versions/?${params.toString()}`, HttpMethod.GET);
  });

  it('should get versions without HttpParams', () => {
    spectator.service.versions(pk).subscribe(data => {
      expect(data).toEqual([mockDMPVersion]);
    });
    spectator.expectOne(`${spectator.service.apiUrl}${pk}/versions/`, HttpMethod.GET);
  });

  it('should preview a specific version', () => {
    spectator.service.previewVersion(pk, version).subscribe(data => {
      expect(data).toEqual(mockDMPVersion);
    });
    spectator.expectOne(`${spectator.service.apiUrl}${pk}/versions/${version}/preview/`, HttpMethod.GET);
  });

  it('should add a new version', () => {
    spectator.service.addVersion(pk, { summary: 'Test' }).subscribe(data => {
      expect(data).toEqual(mockDMP);
    });
    spectator.expectOne(`${spectator.service.apiUrl}${pk}/versions/`, HttpMethod.POST);
  });

  it('should restore a specific version with a new version already in progress', () => {
    spectator.service.restoreVersion(pk, version, true).subscribe(data => {
      expect(data).toEqual(mockDMP);
    });
    spectator.expectOne(`${spectator.service.apiUrl}${pk}/versions/`, HttpMethod.POST);
  });

  it('should restore a specific version with now new version in progress', () => {
    spectator.service.restoreVersion(pk, version, false).subscribe(data => {
      expect(data).toEqual(mockDMP);
    });
    spectator.expectOne(`${spectator.service.apiUrl}${pk}/versions/${version}/restore/`, HttpMethod.POST);
  });

  it('should get export link', () => {
    spectator.service.export(pk).subscribe(data => {
      expect(data).toEqual(mockExportLink);
    });
    spectator.expectOne(`${spectator.service.apiUrl}${pk}/get_export_link/`, HttpMethod.GET);
  });

  it('should export as specific file type', () => {
    const type = 'html';
    spectator.service.exportAsType(pk, type).subscribe();
    spectator.expectOne(`${spectator.service.apiUrl}${pk}/export/?type=${type}`, HttpMethod.GET);
  });

  it('should lock a DMP', () => {
    spectator.service.lock(pk).subscribe();
    spectator.expectOne(`${spectator.service.apiUrl}${pk}/lock/`, HttpMethod.POST);
  });

  it('should unlock a DMP', () => {
    spectator.service.unlock(pk).subscribe();
    spectator.expectOne(`${spectator.service.apiUrl}${pk}/unlock/`, HttpMethod.POST);
  });
});
