/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { LabelModule } from '@app/modules/label/label.module';
import { LoadingModule } from '@app/modules/loading/loading.module';
import { TaskModule } from '@app/modules/task/task.module';
import { ProjectsService } from '@app/services';
import { getTranslocoModule } from '@app/transloco-testing.module';
import { FormsModule } from '@eworkbench/forms';
import { IconsModule } from '@eworkbench/icons';
import { mockProject, mockTask } from '@eworkbench/mocks';
import { ModalsModule } from '@eworkbench/modals';
import { WysiwygEditorModule } from '@eworkbench/wysiwyg-editor';
import { DialogRef, DialogService } from '@ngneat/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { ToastrService } from 'ngx-toastr';
import { of, Subject } from 'rxjs';
import { NewTaskModalComponent } from './new.component';

describe('NewTaskModalComponent', () => {
  let spectator: Spectator<NewTaskModalComponent>;
  const createComponent = createComponentFactory({
    component: NewTaskModalComponent,
    imports: [
      ModalsModule,
      HttpClientTestingModule,
      getTranslocoModule(),
      FormsModule,
      WysiwygEditorModule,
      LabelModule,
      IconsModule,
      TaskModule,
      LoadingModule,
    ],
    providers: [
      mockProvider(DialogRef, {
        close: () => {},
        afterClosed$: new Subject(),
        data: {},
      }),
      mockProvider(ProjectsService, {
        getList: () => of({ total: 1, data: [mockProject] }),
      }),
    ],
    mocks: [ToastrService, DialogService],
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

  it('should patch form with initial values', () => {
    spectator.setInput({
      initialState: mockTask,
    });
    const patchFormValuesSpy = spyOn(spectator.component, 'patchFormValues').and.callThrough();
    spectator.component.patchFormValues();
    expect(patchFormValuesSpy).toHaveBeenCalledTimes(1);
  });
});
