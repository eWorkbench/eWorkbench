/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Spectator, createComponentFactory } from '@ngneat/spectator/jest';
import { NewStorageModalComponent } from './new.component';
import { getTranslocoModule } from '@app/transloco-testing.module';
import { mockProvider } from '@ngneat/spectator';
import { DialogRef, DialogService } from '@ngneat/dialog';
import { Subject } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ModalsModule } from '@eworkbench/modals';
import { FormsModule } from '@eworkbench/forms';
import { FormHelperModule } from '@app/modules/form-helper/form-helper.module';
import { LoadingModule } from '@app/modules/loading/loading.module';

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
    ],
    mocks: [ToastrService, DialogService],
  });

  beforeEach(() => (spectator = createComponent()));

  it('should create', () => {
    expect(spectator).toBeTruthy();
  });

  it('should call onSubmit()', () => {
    const onSubmitSpy = spyOn(spectator.component, 'onSubmit').and.callThrough();
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
