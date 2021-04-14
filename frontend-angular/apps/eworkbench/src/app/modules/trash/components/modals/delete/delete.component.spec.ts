/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { inject } from '@angular/core/testing';
import { LoadingModule } from '@app/modules/loading/loading.module';
import { AuthService } from '@app/services';
import { UserService } from '@app/stores/user';
import { getTranslocoModule } from '@app/transloco-testing.module';
import { FormsModule } from '@eworkbench/forms';
import { MockService } from '@eworkbench/mocks';
import { ModalsModule } from '@eworkbench/modals';
import { DialogRef } from '@ngneat/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { ToastrService } from 'ngx-toastr';
import { of, Subject } from 'rxjs';
import { DeleteModalComponent } from './delete.component';

describe('DeleteModalComponent', () => {
  let spectator: Spectator<DeleteModalComponent>;
  const createComponent = createComponentFactory({
    component: DeleteModalComponent,
    imports: [ModalsModule, FormsModule, HttpClientTestingModule, getTranslocoModule(), LoadingModule],
    providers: [
      MockService,
      mockProvider(UserService, {
        get: () => of([]),
        changeSettings: () => of([]),
      }),
      mockProvider(AuthService, {
        user$: of([]),
      }),
      mockProvider(DialogRef, {
        close: () => {},
        afterClosed$: new Subject(),
        data: {},
      }),
    ],
    mocks: [ToastrService],
  });

  beforeEach(() => (spectator = createComponent()));

  it('should create', () => {
    expect(spectator).toBeTruthy();
  });

  it('should call onSubmit()', inject([MockService], (service: MockService) => {
    spectator.setInput({
      service: service,
    });
    const onSubmitSpy = spyOn(spectator.component, 'onSubmit').and.callThrough();
    spectator.component.onSubmit();
    expect(onSubmitSpy).toHaveBeenCalledTimes(1);
    spectator.setInput({
      loading: true,
    });
    spectator.component.onSubmit();
    expect(onSubmitSpy).toHaveBeenCalledTimes(2);
  }));

  it('should call onSubmit() without service', () => {
    const onSubmitSpy = spyOn(spectator.component, 'onSubmit').and.callThrough();
    spectator.component.onSubmit();
    expect(onSubmitSpy).toHaveBeenCalledTimes(1);
    spectator.setInput({
      loading: true,
    });
    spectator.component.onSubmit();
    expect(onSubmitSpy).toHaveBeenCalledTimes(2);
  });

  it('should call saveUserDialogSettings()', () => {
    const saveUserDialogSettingsSpy = spyOn(spectator.component, 'saveUserDialogSettings').and.callThrough();
    spectator.component.saveUserDialogSettings();
    expect(saveUserDialogSettingsSpy).toHaveBeenCalledTimes(1);
  });
});
