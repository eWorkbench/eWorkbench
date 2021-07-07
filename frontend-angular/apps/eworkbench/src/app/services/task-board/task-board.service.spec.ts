/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {
  mockExportLink,
  mockKanbanTask,
  mockPrivileges,
  mockPrivilegesApi,
  mockTaskBoard,
  mockTaskBoardColumn,
  mockTaskBoardPayload,
} from '@eworkbench/mocks';
import { mockProvider } from '@ngneat/spectator';
import { createHttpFactory, HttpMethod, SpectatorHttp } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { TaskBoardsService } from './task-board.service';

const taskBoardId = '470ddfdc-6180-4cb3-91b8-6b27a8b760fc';
const userId = 1;
const taskId = 'adcb4e46-68a1-444a-92b3-be89e073646c';

describe('TaskBoardService', () => {
  let spectator: SpectatorHttp<TaskBoardsService>;
  const createService = createHttpFactory({
    service: TaskBoardsService,
    providers: [
      mockProvider(TaskBoardsService, {
        getList: () => of([mockTaskBoard]),
        get: () => of({ privileges: mockPrivileges, data: mockTaskBoard }),
        delete: () => of(mockTaskBoard),
        restore: () => of(mockTaskBoard),
        getTasks: () => of([mockKanbanTask]),
        moveColumn: () => of({ kanban_board_columns: mockTaskBoardColumn, pk: taskBoardId }),
        moveCard: () => of(mockTaskBoardColumn),
        deleteCard: () => of([]),
        changeBackgroundImage: () => of(mockTaskBoard),
        changeBackgroundColor: () => of(mockTaskBoard),
        clearBackgroundImage: () => of([]),
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
    expect(spectator.service).toBeTruthy();
  });

  it('should call getList()', () => {
    const getListSpy = jest.spyOn(spectator.service, 'getList');
    spectator.service.getList();
    expect(getListSpy).toHaveBeenCalledTimes(1);
  });

  it('should get task boards', () => {
    spectator.service.getList().subscribe(data => expect(data).toEqual([mockTaskBoard]));
    spectator.expectOne(spectator.service.apiUrl, HttpMethod.GET);
  });

  it('should get one task board', () => {
    spectator.service.get(taskBoardId, userId).subscribe(data => expect(data).toEqual(mockTaskBoard));
    spectator.expectOne(`${spectator.service.apiUrl}${taskBoardId}/`, HttpMethod.GET);
  });

  it('should get privileges for users', () => {
    spectator.service.getPrivilegesList(taskBoardId).subscribe(data => {
      expect(data).toEqual([mockPrivilegesApi]);
    });
    spectator.expectOne(`${spectator.service.apiUrl}${taskBoardId}/privileges/`, HttpMethod.GET);
  });

  it('should get privileges for a single user', () => {
    spectator.service.getUserPrivileges(taskBoardId, userId, mockTaskBoard.deleted).subscribe(data => {
      expect(data).toEqual(mockPrivileges);
    });
    spectator.expectOne(`${spectator.service.apiUrl}${taskBoardId}/privileges/${userId}/`, HttpMethod.GET);
  });

  it('should add privileges for a user', () => {
    spectator.service.addUserPrivileges(taskBoardId, userId).subscribe(data => {
      expect(data).toEqual(mockPrivilegesApi);
    });
    spectator.expectOne(`${spectator.service.apiUrl}${taskBoardId}/privileges/?pk=${userId}`, HttpMethod.POST);
  });

  it('should put privileges for a user', () => {
    spectator.service.putUserPrivileges(taskBoardId, userId, mockPrivilegesApi).subscribe(data => {
      expect(data).toEqual(mockPrivilegesApi);
    });
    spectator.expectOne(`${spectator.service.apiUrl}${taskBoardId}/privileges/${userId}/`, HttpMethod.PUT);
  });

  it('should delete privileges for a user', () => {
    spectator.service.deleteUserPrivileges(taskBoardId, userId).subscribe(data => {
      expect(data).toEqual([mockPrivilegesApi]);
    });
    spectator.expectOne(`${spectator.service.apiUrl}${taskBoardId}/privileges/${userId}/`, HttpMethod.DELETE);
  });

  it('should delete one task board', () => {
    spectator.service.delete(taskBoardId).subscribe(data => expect(data).toEqual(mockTaskBoard));
    spectator.expectOne(`${spectator.service.apiUrl}${taskBoardId}/soft_delete/`, HttpMethod.PATCH);
  });

  it('should patch one task board', () => {
    spectator.service.patch(taskBoardId, mockTaskBoardPayload).subscribe(val => expect(val).toEqual(mockTaskBoard));
    spectator.expectOne(`${spectator.service.apiUrl}${taskBoardId}/`, HttpMethod.PATCH);
  });

  it('should restore one task board', () => {
    spectator.service.restore(taskBoardId).subscribe(data => expect(data).toEqual(mockTaskBoard));
    spectator.expectOne(`${spectator.service.apiUrl}${taskBoardId}/restore/`, HttpMethod.PATCH);
  });

  it('should get tasks', () => {
    spectator.service.getTasks(taskBoardId).subscribe(data => expect(data).toEqual([mockKanbanTask]));
    spectator.expectOne(`${spectator.service.apiUrl}${taskBoardId}/tasks/`, HttpMethod.GET);
  });

  it('should move column', () => {
    spectator.service
      .moveColumn(taskBoardId, [mockTaskBoardColumn])
      .subscribe(data => expect(data).toEqual({ kanban_board_columns: mockTaskBoardColumn, pk: taskBoardId }));
    spectator.expectOne(`${spectator.service.apiUrl}${taskBoardId}/`, HttpMethod.PATCH);
  });

  it('should move card', () => {
    spectator.service
      .moveCard(taskBoardId, { assignment_pk: taskId, to_column: '24bbca96-da34-4dfd-9ce5-88295152ef1f', to_index: 2 })
      .subscribe(data => expect(data).toEqual(mockTaskBoardColumn));
    spectator.expectOne(`${spectator.service.apiUrl}${taskBoardId}/tasks/move_assignment/`, HttpMethod.PUT);
  });

  it('should delete card', () => {
    spectator.service.deleteCard(taskBoardId, taskId).subscribe();
    spectator.expectOne(`${spectator.service.apiUrl}${taskBoardId}/tasks/${taskId}/`, HttpMethod.DELETE);
  });

  it('should change the background image', () => {
    spectator.service.changeBackgroundImage(taskBoardId, {}).subscribe(data => expect(data).toEqual(mockTaskBoard));
    spectator.expectOne(`${spectator.service.apiUrl}${taskBoardId}/`, HttpMethod.PATCH);
  });

  it('should change the background color', () => {
    spectator.service.changeBackgroundColor(taskBoardId, 'rgba(224,177,177,1)').subscribe(data => expect(data).toEqual(mockTaskBoard));
    spectator.expectOne(`${spectator.service.apiUrl}${taskBoardId}/`, HttpMethod.PATCH);
  });

  it('should clear the background image', () => {
    spectator.service.clearBackgroundImage(taskBoardId).subscribe();
    spectator.expectOne(`${spectator.service.apiUrl}${taskBoardId}/clear_background_image/`, HttpMethod.PATCH);
  });

  it('should get export link', () => {
    spectator.service.export(taskBoardId).subscribe(data => {
      expect(data).toEqual(mockExportLink);
    });
    spectator.expectOne(`${spectator.service.apiUrl}${taskBoardId}/get_export_link/`, HttpMethod.GET);
  });
});
