/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpParams } from '@angular/common/http';
import {
  mockContact,
  mockContactHistory,
  mockContactPayload,
  mockContactsList,
  mockContactVersion,
  mockExportLink,
  mockPrivileges,
  mockPrivilegesApi,
} from '@eworkbench/mocks';
import { createHttpFactory, HttpMethod, mockProvider, SpectatorHttp } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { ContactsService } from './contacts.service';

const pk = '185cdf73-57d3-442e-b778-7ccba9a54b4e';
const userId = 1;
const version = '09e98b46-2ebf-4c27-9240-1b240ff5987e';

describe('ContactsService', () => {
  let spectator: SpectatorHttp<ContactsService>;
  const createService = createHttpFactory({
    service: ContactsService,
    providers: [
      mockProvider(ContactsService, {
        getList: () => of(mockContactsList),
        add: () => of(mockContact),
        get: () => of({ privileges: mockPrivileges, data: mockContact }),
        patch: () => of(mockContact),
        restore: () => of(mockContact),
        history: () => of(mockContactHistory),
        versions: () => of([mockContactVersion]),
        previewVersion: () => of(mockContactVersion),
        addVersion: () => of(mockContact),
        restoreVersion: () => of(mockContact),
        export: () => of(mockExportLink),
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
    const getListSpy = spyOn(spectator.service, 'getList').and.callThrough();
    spectator.service.getList();
    expect(getListSpy).toHaveBeenCalledTimes(1);
  });

  it('should add a new contact', () => {
    spectator.service.add(mockContactPayload).subscribe(val => expect(val).toEqual(mockContact));
    spectator.expectOne(spectator.service.apiUrl, HttpMethod.POST);
  });

  it('should get data with HttpParams', () => {
    const params = new HttpParams().set('test', 'true');
    spectator.service.getList(params).subscribe(data => {
      expect(data).toEqual(mockContact);
    });
    spectator.expectOne(`${spectator.service.apiUrl}?${params.toString()}`, HttpMethod.GET);
  });

  it('should get data without HttpParams', () => {
    spectator.service.getList().subscribe(data => {
      expect(data).toEqual(mockContact);
    });
    spectator.expectOne(spectator.service.apiUrl, HttpMethod.GET);
  });

  it('should get contact details', () => {
    spectator.service.get(pk, userId).subscribe(data => {
      expect(data).toEqual(mockContact);
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
    spectator.service.getUserPrivileges(pk, userId, mockContact.deleted).subscribe(data => {
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

  it('should delete a contact', () => {
    spectator.service.delete(pk).subscribe(data => {
      expect(data).toEqual(mockContact);
    });
    spectator.expectOne(`${spectator.service.apiUrl}${pk}/soft_delete/`, HttpMethod.PATCH);
  });

  it('should patch a contact', () => {
    spectator.service.patch(pk, mockContactPayload).subscribe(val => expect(val).toEqual(mockContact));
    spectator.expectOne(`${spectator.service.apiUrl}${pk}/`, HttpMethod.PATCH);
  });

  it('should restore a contact', () => {
    spectator.service.restore(pk).subscribe(data => {
      expect(data).toEqual(mockContact);
    });
    spectator.expectOne(`${spectator.service.apiUrl}${pk}/restore/`, HttpMethod.PATCH);
  });

  it('should get history with HttpParams', () => {
    const params = new HttpParams().set('test', 'true');
    spectator.service.history(pk, params).subscribe(data => {
      expect(data).toEqual(mockContactHistory);
    });
    spectator.expectOne(`${spectator.service.apiUrl}${pk}/history/?${params.toString()}`, HttpMethod.GET);
  });

  it('should get history without HttpParams', () => {
    spectator.service.history(pk).subscribe(data => {
      expect(data).toEqual(mockContactHistory);
    });
    spectator.expectOne(`${spectator.service.apiUrl}${pk}/history/`, HttpMethod.GET);
  });

  it('should get versions with HttpParams', () => {
    const params = new HttpParams().set('test', 'true');
    spectator.service.versions(pk, params).subscribe(data => {
      expect(data).toEqual([mockContactVersion]);
    });
    spectator.expectOne(`${spectator.service.apiUrl}${pk}/versions/?${params.toString()}`, HttpMethod.GET);
  });

  it('should get versions without HttpParams', () => {
    spectator.service.versions(pk).subscribe(data => {
      expect(data).toEqual([mockContactVersion]);
    });
    spectator.expectOne(`${spectator.service.apiUrl}${pk}/versions/`, HttpMethod.GET);
  });

  it('should preview a specific version', () => {
    spectator.service.previewVersion(pk, version).subscribe(data => {
      expect(data).toEqual(mockContactVersion);
    });
    spectator.expectOne(`${spectator.service.apiUrl}${pk}/versions/${version}/preview/`, HttpMethod.GET);
  });

  it('should add a new version', () => {
    spectator.service.addVersion(pk, { summary: 'Test' }).subscribe(data => {
      expect(data).toEqual(mockContact);
    });
    spectator.expectOne(`${spectator.service.apiUrl}${pk}/versions/`, HttpMethod.POST);
  });

  it('should restore a specific version with a new version already in progress', () => {
    spectator.service.restoreVersion(pk, version, true).subscribe(data => {
      expect(data).toEqual(mockContact);
    });
    spectator.expectOne(`${spectator.service.apiUrl}${pk}/versions/`, HttpMethod.POST);
  });

  it('should restore a specific version with now new version in progress', () => {
    spectator.service.restoreVersion(pk, version, false).subscribe(data => {
      expect(data).toEqual(mockContact);
    });
    spectator.expectOne(`${spectator.service.apiUrl}${pk}/versions/${version}/restore/`, HttpMethod.POST);
  });

  it('should get export link', () => {
    spectator.service.export(pk).subscribe(data => {
      expect(data).toEqual(mockExportLink);
    });
    spectator.expectOne(`${spectator.service.apiUrl}${pk}/get_export_link/`, HttpMethod.GET);
  });

  it('should lock a contact', () => {
    spectator.service.lock(pk).subscribe();
    spectator.expectOne(`${spectator.service.apiUrl}${pk}/lock/`, HttpMethod.POST);
  });

  it('should unlock a contact', () => {
    spectator.service.unlock(pk).subscribe();
    spectator.expectOne(`${spectator.service.apiUrl}${pk}/unlock/`, HttpMethod.POST);
  });

  it('should share a contact', () => {
    spectator.service.share(mockContact).subscribe();
    spectator.expectOne(spectator.service.shareUrl, HttpMethod.POST);
  });
});
