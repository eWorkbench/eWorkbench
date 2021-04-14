/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Spectator, createComponentFactory } from '@ngneat/spectator/jest';
import { DeleteStorageDirectoryModalComponent } from './delete.component';
import { getTranslocoModule } from '@app/transloco-testing.module';
import { mockProvider } from '@ngneat/spectator';
import { DialogRef } from '@ngneat/dialog';
import { of, Subject } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { LoadingModule } from '@app/modules/loading/loading.module';
import { AuthService, DrivesService } from '@app/services';
import { mockDirectory, mockDrive, mockUser } from '@eworkbench/mocks';
import { ModalsModule } from '@eworkbench/modals';
import { FormsModule } from '@eworkbench/forms';

describe('DeleteStorageDirectoryModalComponent', () => {
  let spectator: Spectator<DeleteStorageDirectoryModalComponent>;
  const createComponent = createComponentFactory({
    component: DeleteStorageDirectoryModalComponent,
    imports: [getTranslocoModule(), HttpClientTestingModule, LoadingModule, ModalsModule, FormsModule],
    providers: [
      mockProvider(DrivesService, {
        deleteDirectory: () => of([]),
      }),
      mockProvider(AuthService, {
        user$: of({ state: { user: mockUser } }),
      }),
      mockProvider(DialogRef, {
        close: () => {},
        afterClosed$: new Subject(),
        data: {},
      }),
    ],
    mocks: [ToastrService],
  });

  beforeEach(() => (spectator = createComponent({ props: { storage: mockDrive, directory: mockDirectory } })));

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

  it('should call saveUserDialogSettings()', () => {
    const saveUserDialogSettingsSpy = spyOn(spectator.component, 'saveUserDialogSettings').and.callThrough();
    spectator.component.saveUserDialogSettings();
    expect(saveUserDialogSettingsSpy).toHaveBeenCalledTimes(1);
  });
});
