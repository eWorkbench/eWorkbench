/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { EventEmitter } from '@angular/core';
import { getTranslocoModule } from '@app/transloco-testing.module';
import { FormsModule } from '@eworkbench/forms';
import { ModalsModule } from '@eworkbench/modals';
import { TableModule } from '@eworkbench/table';
import { ModalCallback } from '@eworkbench/types';
import { DialogRef } from '@ngneat/dialog';
import { createRoutingFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { ToastrService } from 'ngx-toastr';
import { Subject } from 'rxjs';
import { RestoreModalComponent } from './restore.component';

describe('RestoreModalComponent', () => {
  let spectator: Spectator<RestoreModalComponent>;
  const createComponent = createRoutingFactory({
    component: RestoreModalComponent,
    imports: [FormsModule, HttpClientTestingModule, getTranslocoModule(), TableModule, ModalsModule],
    providers: [
      mockProvider(DialogRef, {
        beforeClose: () => true,
        close: () => {},
        afterClosed$: new Subject(),
        data: {},
      }),
    ],
    mocks: [ToastrService],
  });

  beforeEach(() => (spectator = createComponent({ props: { restoreEmitter: new EventEmitter<ModalCallback>() } })));

  it('should create', () => {
    expect(spectator).toBeTruthy();
  });

  it('should call onRestore() without changes', () => {
    const onRestoreSpy = spyOn(spectator.component, 'onRestore').and.callThrough();
    spectator.component.onRestore(false);
    expect(onRestoreSpy).toHaveBeenCalledWith(false);
    expect(onRestoreSpy).toHaveBeenCalledTimes(1);
  });

  it('should call onRestore() with changes', () => {
    const onRestoreSpy = spyOn(spectator.component, 'onRestore').and.callThrough();
    spectator.component.onRestore(true);
    expect(onRestoreSpy).toHaveBeenCalledWith(true);
    expect(onRestoreSpy).toHaveBeenCalledTimes(1);
  });
});
