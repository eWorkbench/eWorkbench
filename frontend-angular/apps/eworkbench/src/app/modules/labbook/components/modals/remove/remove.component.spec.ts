/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Spectator, createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { LabBookElementRemoveModalComponent } from './remove.component';
import { getTranslocoModule } from '@app/transloco-testing.module';
import { ModalsModule } from '@eworkbench/modals';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ToastrService } from 'ngx-toastr';
import { LoadingModule } from '@app/modules/loading/loading.module';
import { FormsModule } from '@eworkbench/forms';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { DialogRef } from '@ngneat/dialog';
import { Subject } from 'rxjs';
import { ModalState } from '@app/enums/modal-state.enum';

describe('LabBookElementRemoveModalComponent', () => {
  let spectator: Spectator<LabBookElementRemoveModalComponent>;
  const createComponent = createComponentFactory({
    component: LabBookElementRemoveModalComponent,
    imports: [getTranslocoModule(), ModalsModule, HttpClientTestingModule, LoadingModule, FormsModule, TooltipModule],
    providers: [
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

  it('should call onSubmit()', () => {
    expect(spectator.component.state).toBe(ModalState.Unchanged);
    const onSubmitSpy = jest.spyOn(spectator.component, 'onSubmit');
    spectator.component.onSubmit();
    expect(onSubmitSpy).toHaveBeenCalledTimes(1);
    expect(spectator.component.state).toBe(ModalState.Changed);
  });

  it('should call saveUserDialogSettings()', () => {
    const saveUserDialogSettingsSpy = jest.spyOn(spectator.component, 'saveUserDialogSettings');
    spectator.component.saveUserDialogSettings();
    expect(saveUserDialogSettingsSpy).toHaveBeenCalledTimes(1);
  });
});
