/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpParams } from '@angular/common/http';
import {
  mockExportLink,
  mockPrivileges,
  mockPrivilegesApi,
  mockTask,
  mockTaskBoardAssignment,
  mockTaskHistory,
  mockTaskPayload,
  mockTasksList,
  mockTaskVersion,
} from '@eworkbench/mocks';
import { createHttpFactory, HttpMethod, mockProvider, SpectatorHttp } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { TasksService } from './tasks.service';

const pk = '185cdf73-57d3-442e-b778-7ccba9a54b4e';
const userId = 1;
const version = '09e98b46-2ebf-4c27-9240-1b240ff5987e';

describe('TasksService', () => {
  let spectator: SpectatorHttp<TasksService>;
  const createService = createHttpFactory({
    service: TasksService,
    providers: [
      mockProvider(TasksService, {
        add: () => of(mockTask),
        get: () => of({ privileges: mockPrivileges, data: mockTask }),
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

  it('should add a new task', () => {
    spectator.service.add(mockTaskPayload).subscribe(val => expect(val).toEqual(mockTask));
    spectator.expectOne(spectator.service.apiUrl, HttpMethod.POST);
  });

  it('should get data with HttpParams', () => {
    const params = new HttpParams().set('test', 'true');
    spectator.service.getList(params).subscribe(data => {
      expect(data).toEqual(mockTasksList);
    });
    spectator.expectOne(`${spectator.service.apiUrl}?${params.toString()}`, HttpMethod.GET);
  });

  it('should get data without HttpParams', () => {
    spectator.service.getList().subscribe(data => {
      expect(data).toEqual(mockTasksList);
    });
    spectator.expectOne(spectator.service.apiUrl, HttpMethod.GET);
  });

  it('should get task details', () => {
    spectator.service.get(pk, userId).subscribe(data => {
      expect(data).toEqual(mockTask);
    });
    spectator.expectOne(`${spectator.service.apiUrl}${pk}/`, HttpMethod.GET);
  });

  it('should get task board assignments for task', () => {
    spectator.service.getTaskBoardAssignments(pk).subscribe(data => {
      expect(data).toEqual([mockTaskBoardAssignment]);
    });
    spectator.expectOne(`${spectator.service.apiUrl}${pk}/kanbanboard_assignments/`, HttpMethod.GET);
  });

  it('should get privileges for users', () => {
    spectator.service.getPrivilegesList(pk).subscribe(data => {
      expect(data).toEqual([mockPrivilegesApi]);
    });
    spectator.expectOne(`${spectator.service.apiUrl}${pk}/privileges/`, HttpMethod.GET);
  });

  it('should get privileges for a single user', () => {
    spectator.service.getUserPrivileges(pk, userId, mockTask.deleted).subscribe(data => {
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

  it('should delete a task', () => {
    spectator.service.delete(pk).subscribe(data => {
      expect(data).toEqual(mockTask);
    });
    spectator.expectOne(`${spectator.service.apiUrl}${pk}/soft_delete/`, HttpMethod.PATCH);
  });

  it('should patch a task', () => {
    spectator.service.patch(pk, mockTaskPayload).subscribe(val => expect(val).toEqual(mockTask));
    spectator.expectOne(`${spectator.service.apiUrl}${pk}/`, HttpMethod.PATCH);
  });

  it('should restore a task', () => {
    spectator.service.restore(pk).subscribe(data => {
      expect(data).toEqual(mockTask);
    });
    spectator.expectOne(`${spectator.service.apiUrl}${pk}/restore/`, HttpMethod.PATCH);
  });

  it('should get history with HttpParams', () => {
    const params = new HttpParams().set('test', 'true');
    spectator.service.history(pk, params).subscribe(data => {
      expect(data).toEqual(mockTaskHistory);
    });
    spectator.expectOne(`${spectator.service.apiUrl}${pk}/history/?${params.toString()}`, HttpMethod.GET);
  });

  it('should get history without HttpParams', () => {
    spectator.service.history(pk).subscribe(data => {
      expect(data).toEqual(mockTaskHistory);
    });
    spectator.expectOne(`${spectator.service.apiUrl}${pk}/history/`, HttpMethod.GET);
  });

  it('should get versions with HttpParams', () => {
    const params = new HttpParams().set('test', 'true');
    spectator.service.versions(pk, params).subscribe(data => {
      expect(data).toEqual([mockTaskVersion]);
    });
    spectator.expectOne(`${spectator.service.apiUrl}${pk}/versions/?${params.toString()}`, HttpMethod.GET);
  });

  it('should get versions without HttpParams', () => {
    spectator.service.versions(pk).subscribe(data => {
      expect(data).toEqual([mockTaskVersion]);
    });
    spectator.expectOne(`${spectator.service.apiUrl}${pk}/versions/`, HttpMethod.GET);
  });

  it('should preview a specific version', () => {
    spectator.service.previewVersion(pk, version).subscribe(data => {
      expect(data).toEqual(mockTaskVersion);
    });
    spectator.expectOne(`${spectator.service.apiUrl}${pk}/versions/${version}/preview/`, HttpMethod.GET);
  });

  it('should add a new version', () => {
    spectator.service.addVersion(pk, { summary: 'Test' }).subscribe(data => {
      expect(data).toEqual(mockTask);
    });
    spectator.expectOne(`${spectator.service.apiUrl}${pk}/versions/`, HttpMethod.POST);
  });

  it('should restore a specific version with a new version already in progress', () => {
    spectator.service.restoreVersion(pk, version, true).subscribe(data => {
      expect(data).toEqual(mockTask);
    });
    spectator.expectOne(`${spectator.service.apiUrl}${pk}/versions/`, HttpMethod.POST);
  });

  it('should restore a specific version with now new version in progress', () => {
    spectator.service.restoreVersion(pk, version, false).subscribe(data => {
      expect(data).toEqual(mockTask);
    });
    spectator.expectOne(`${spectator.service.apiUrl}${pk}/versions/${version}/restore/`, HttpMethod.POST);
  });

  it('should get export link', () => {
    spectator.service.export(pk).subscribe(data => {
      expect(data).toEqual(mockExportLink);
    });
    spectator.expectOne(`${spectator.service.apiUrl}${pk}/get_export_link/`, HttpMethod.GET);
  });

  it('should lock a task', () => {
    spectator.service.lock(pk).subscribe();
    spectator.expectOne(`${spectator.service.apiUrl}${pk}/lock/`, HttpMethod.POST);
  });

  it('should unlock a task', () => {
    spectator.service.unlock(pk).subscribe();
    spectator.expectOne(`${spectator.service.apiUrl}${pk}/unlock/`, HttpMethod.POST);
  });
});
