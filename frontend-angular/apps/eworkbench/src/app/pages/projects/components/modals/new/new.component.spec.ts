/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormHelperModule } from '@app/modules/form-helper/form-helper.module';
import { LoadingModule } from '@app/modules/loading/loading.module';
import { ProjectModule } from '@app/modules/project/project.module';
import { ProjectsService } from '@app/services';
import { getTranslocoModule } from '@app/transloco-testing.module';
import { FormsModule } from '@eworkbench/forms';
import { mockProject } from '@eworkbench/mocks';
import { ModalsModule } from '@eworkbench/modals';
import { WysiwygEditorModule } from '@eworkbench/wysiwyg-editor';
import { DialogRef, DialogService } from '@ngneat/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import Chance from 'chance';
import { ToastrService } from 'ngx-toastr';
import { of, Subject } from 'rxjs';
import { NewProjectModalComponent } from './new.component';

describe('NewProjectModalComponent', () => {
  let spectator: Spectator<NewProjectModalComponent>;
  let chance: Chance.Chance;
  const createComponent = createComponentFactory({
    component: NewProjectModalComponent,
    imports: [
      ModalsModule,
      FormsModule,
      HttpClientTestingModule,
      getTranslocoModule(),
      WysiwygEditorModule,
      LoadingModule,
      ProjectModule,
      FormHelperModule,
    ],
    providers: [
      mockProvider(ProjectsService, {
        add: () => of(mockProject),
        getList: () => of({ total: 1, data: [mockProject] }),
      }),
      mockProvider(DialogRef, {
        close: () => {},
        afterClosed$: new Subject(),
        data: {},
      }),
    ],
    mocks: [ToastrService, DialogService],
  });

  beforeEach(() => (spectator = createComponent()));

  beforeEach(() => (chance = new Chance()));

  it('should create', () => {
    expect(spectator).toBeTruthy();
  });

  it('should add a new project', () => {
    const onSubmitSpy = jest.spyOn(spectator.component, 'onSubmit');
    spectator.component.form.controls.name.setValue(chance.string({ alpha: true, symbols: false }));
    spectator.component.onSubmit();
    expect(onSubmitSpy).toHaveBeenCalledTimes(1);
  });

  it('should be in loading state and not add a new project', () => {
    spectator.setInput({
      loading: true,
    });
    const onSubmitSpy = jest.spyOn(spectator.component, 'onSubmit');
    spectator.component.form.controls.name.setValue(chance.string({ alpha: true, symbols: false }));
    spectator.component.onSubmit();
    expect(onSubmitSpy).toHaveBeenCalledTimes(1);
  });
});
