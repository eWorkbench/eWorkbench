/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpParams } from '@angular/common/http';
import { mockTask } from '@eworkbench/mocks';
import { createHttpFactory, HttpMethod, mockProvider, SpectatorHttp } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { TasksBacklogService } from './tasks-backlog.service';

const taskBoardId = '470ddfdc-6180-4cb3-91b8-6b27a8b760fc';

describe('TasksBacklogService', () => {
  let spectator: SpectatorHttp<TasksBacklogService>;
  const createService = createHttpFactory({
    service: TasksBacklogService,
    providers: [
      mockProvider(TasksBacklogService, {
        getList: () => of([mockTask]),
        addTasks: () => of([]),
      }),
    ],
  });

  beforeEach(() => (spectator = createService()));

  it('should be created', () => {
    expect(spectator.service).toBeTruthy();
  });

  it('should call getList()', () => {
    const getListSpy = spyOn(spectator.service, 'getList').and.callThrough();
    spectator.service.getList(new HttpParams(), taskBoardId);
    expect(getListSpy).toHaveBeenCalledTimes(1);
  });

  it('should get tasks', () => {
    spectator.service.getList(new HttpParams(), taskBoardId).subscribe(val => expect(val).toEqual([mockTask]));
    spectator.expectOne(`${spectator.service.apiUrl}kanbanboards/${taskBoardId}/tasks/`, HttpMethod.GET);
  });

  it('should call addTasks()', () => {
    const addTasksSpy = spyOn(spectator.service, 'addTasks').and.callThrough();
    spectator.service.addTasks(taskBoardId, {});
    expect(addTasksSpy).toHaveBeenCalledTimes(1);
  });
});
