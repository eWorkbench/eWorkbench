/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ModalState } from '@app/enums/modal-state.enum';
import { LoadingModule } from '@app/modules/loading/loading.module';
import { ProjectsService, TaskBoardsService } from '@app/services';
import { getTranslocoModule } from '@app/transloco-testing.module';
import { FormsModule } from '@eworkbench/forms';
import { IconsModule } from '@eworkbench/icons';
import { mockKanbanTask, mockProject, mockTaskBoardColumn } from '@eworkbench/mocks';
import { ModalsModule } from '@eworkbench/modals';
import { TableModule } from '@eworkbench/table';
import { DialogRef } from '@ngneat/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { ToastrService } from 'ngx-toastr';
import { of, Subject } from 'rxjs';
import { BacklogModalComponent } from './backlog.component';

describe('BacklogModalComponent', () => {
  let spectator: Spectator<BacklogModalComponent>;
  const createComponent = createComponentFactory({
    component: BacklogModalComponent,
    imports: [ModalsModule, HttpClientTestingModule, getTranslocoModule(), TableModule, LoadingModule, FormsModule, IconsModule],
    providers: [
      mockProvider(TaskBoardsService, {
        get: () => of({ kanban_board_columns: [mockTaskBoardColumn] }),
      }),
      mockProvider(DialogRef, {
        close: () => {},
        afterClosed$: new Subject(),
        data: {},
      }),
      mockProvider(ProjectsService, {
        getList: () => of({ total: 1, data: [mockProject] }),
      }),
    ],
    mocks: [ToastrService],
  });

  beforeEach(() => (spectator = createComponent()));

  it('should create', () => {
    expect(spectator).toBeTruthy();
  });

  it('should call onSubmit()', () => {
    const onSubmitSpy = spyOn(spectator.component, 'onSubmit').and.callThrough();
    spectator.component.onSubmit();
    expect(onSubmitSpy).toHaveBeenCalledTimes(1);
    spectator.setInput({
      loading: true,
    });
    spectator.component.onSubmit();
    expect(onSubmitSpy).toHaveBeenCalledTimes(2);
  });

  it('should change state', () => {
    expect(spectator.component.state).toBe(ModalState.Unchanged);
    spectator.component.onSelected([mockKanbanTask]);
    expect(spectator.component.state).toBe(ModalState.Changed);
  });
});
