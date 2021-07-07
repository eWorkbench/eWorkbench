/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormHelperModule } from '@app/modules/form-helper/form-helper.module';
import { LoadingModule } from '@app/modules/loading/loading.module';
import { ProjectsService } from '@app/services';
import { getTranslocoModule } from '@app/transloco-testing.module';
import { FormsModule } from '@eworkbench/forms';
import { mockProject } from '@eworkbench/mocks';
import { ModalsModule } from '@eworkbench/modals';
import { DialogRef, DialogService } from '@ngneat/dialog';
import { mockProvider, createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { ToastrService } from 'ngx-toastr';
import { of, Subject } from 'rxjs';
import { NewStorageModalComponent } from './new.component';

describe('NewStorageModalComponent', () => {
  let spectator: Spectator<NewStorageModalComponent>;
  const createComponent = createComponentFactory({
    component: NewStorageModalComponent,
    imports: [getTranslocoModule(), HttpClientTestingModule, ModalsModule, FormsModule, FormHelperModule, LoadingModule],
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
    const onSubmitSpy = jest.spyOn(spectator.component, 'onSubmit');
    spectator.setInput({
      loading: false,
    });
    spectator.component.onSubmit();
    expect(onSubmitSpy).toHaveBeenCalledTimes(1);
    spectator.setInput({
      loading: true,
    });
    spectator.component.onSubmit();
    expect(onSubmitSpy).toHaveBeenCalledTimes(2);
  });
});
