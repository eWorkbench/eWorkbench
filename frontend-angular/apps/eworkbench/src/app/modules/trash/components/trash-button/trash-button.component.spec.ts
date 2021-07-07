/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { inject } from '@angular/core/testing';
import { ModalState } from '@app/enums/modal-state.enum';
import { LoadingModule } from '@app/modules/loading/loading.module';
import { AuthService } from '@app/services';
import { getTranslocoModule } from '@app/transloco-testing.module';
import { FormsModule } from '@eworkbench/forms';
import { IconsModule } from '@eworkbench/icons';
import { MockService, mockUserStoreDialogFalse } from '@eworkbench/mocks';
import { ModalsModule } from '@eworkbench/modals';
import { DialogRef, DialogService } from '@ngneat/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { ToastrService } from 'ngx-toastr';
import { of, Subject } from 'rxjs';
import { DeleteModalComponent } from '../modals/delete/delete.component';
import { TrashButtonComponent } from './trash-button.component';

describe('TrashButtonComponent', () => {
  let spectator: Spectator<TrashButtonComponent>;
  const createComponent = createComponentFactory({
    component: TrashButtonComponent,
    declarations: [DeleteModalComponent],
    imports: [
      FormsModule,
      HttpClientTestingModule,
      getTranslocoModule(),
      ModalsModule,
      LoadingModule,
      IconsModule,
      TooltipModule.forRoot(),
    ],
    providers: [
      MockService,
      mockProvider(AuthService, {
        user$: of(mockUserStoreDialogFalse),
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

  beforeEach(inject([MockService], (service: MockService) => {
    spectator.setInput({
      service: service,
    });
  }));

  it('should create', () => {
    expect(spectator).toBeTruthy();
  });

  it('should call delete()', () => {
    const id = '8147b971-9ab6-4f8b-bbf5-76e8eccae3f8';
    const deleteSpy = jest.spyOn(spectator.component, 'delete');
    spectator.component.delete(id);
    expect(deleteSpy).toHaveBeenCalledTimes(1);
    spectator.setInput({
      loading: true,
    });
    spectator.component.delete(id);
    expect(deleteSpy).toHaveBeenCalledTimes(2);
  });

  it('should call onModalClose()', () => {
    const onModalCloseSpy = jest.spyOn(spectator.component, 'onModalClose');
    spectator.component.onModalClose({ state: ModalState.Unchanged });
    expect(onModalCloseSpy).toHaveBeenCalledTimes(1);
    spectator.component.onModalClose({ state: ModalState.Changed });
    expect(onModalCloseSpy).toHaveBeenCalledTimes(2);
  });
});
