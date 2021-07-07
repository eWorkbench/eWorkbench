/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { inject } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ModalState } from '@app/enums/modal-state.enum';
import { UserModule } from '@app/modules/user/user.module';
import { UserStore } from '@app/stores/user';
import { getTranslocoModule } from '@app/transloco-testing.module';
import { FormsModule } from '@eworkbench/forms';
import { IconsModule } from '@eworkbench/icons';
import { MockNewModalComponent, MockService, mockUserStoreDialogFalse } from '@eworkbench/mocks';
import { ModalsModule } from '@eworkbench/modals';
import { TableModule } from '@eworkbench/table';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { CollapseModule } from 'ngx-bootstrap/collapse';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { ToastrService } from 'ngx-toastr';
import { DetailsDropdownComponent } from './details-dropdown.component';

describe('DetailsDropdownComponent', () => {
  let spectator: Spectator<DetailsDropdownComponent>;
  const createComponent = createComponentFactory({
    component: DetailsDropdownComponent,
    imports: [
      HttpClientTestingModule,
      FormsModule,
      getTranslocoModule(),
      CollapseModule.forRoot(),
      BsDropdownModule.forRoot(),
      ModalsModule,
      RouterTestingModule,
      UserModule,
      TableModule,
      TooltipModule,
      IconsModule,
    ],
    providers: [
      MockService,
      mockProvider(UserStore, {
        getValue: () => mockUserStoreDialogFalse,
      }),
    ],
    mocks: [ToastrService],
  });

  beforeEach(inject([MockService], (service: MockService) => {
    spectator = createComponent({
      props: {
        id: '8147b971-9ab6-4f8b-bbf5-76e8eccae3f8',
        service: service,
        initialState: {
          test: true,
        },
        newModalComponent: MockNewModalComponent,
      },
    });
  }));

  beforeEach(() => {
    // @ts-ignore
    delete window.open;
    window.open = jest.fn();
  });

  it('should create', () => {
    expect(spectator).toBeTruthy();
  });

  it('should call onExport()', () => {
    const onExportSpy = jest.spyOn(spectator.component, 'onExport');
    spectator.component.onExport();
    expect(onExportSpy).toHaveBeenCalledTimes(1);
    spectator.setInput({
      loading: true,
    });
    spectator.component.onExport();
    expect(onExportSpy).toHaveBeenCalledTimes(2);
  });

  it('should call delete()', () => {
    spectator.fixture.ngZone?.run(() => {
      const deleteSpy = jest.spyOn(spectator.component, 'delete');
      spectator.component.delete(spectator.component.id);
      expect(deleteSpy).toHaveBeenCalledTimes(1);
      spectator.setInput({
        loading: true,
      });
      spectator.component.delete(spectator.component.id);
      expect(deleteSpy).toHaveBeenCalledTimes(2);
    });
  });

  it('should open the delete modal', () => {
    spectator.fixture.ngZone?.run(() => {
      expect(spectator.component.modalRef).toBeUndefined();
      spectator.component.onDelete();
      expect(spectator.component.modalRef).toBeDefined();
    });
  });

  it('should call onModalClose()', () => {
    spectator.fixture.ngZone?.run(() => {
      const onModalCloseSpy = jest.spyOn(spectator.component, 'onModalClose');
      spectator.component.onModalClose({ state: ModalState.Unchanged });
      expect(onModalCloseSpy).toHaveBeenCalledWith({ state: ModalState.Unchanged });
      expect(onModalCloseSpy).toHaveBeenCalledTimes(1);
      spectator.component.onModalClose({ state: ModalState.Changed });
      expect(onModalCloseSpy).toHaveBeenCalledWith({ state: ModalState.Changed });
      expect(onModalCloseSpy).toHaveBeenCalledTimes(2);
      spectator.component.onModalClose({ navigate: ['/'] });
      expect(onModalCloseSpy).toHaveBeenCalledWith({ navigate: ['/'] });
      expect(onModalCloseSpy).toHaveBeenCalledTimes(3);
    });
  });

  it('should call onOpenDuplicateModal()', () => {
    const onOpenDuplicateModalSpy = jest.spyOn(spectator.component, 'onOpenDuplicateModal');
    const onOpenNewModalSpy = jest.spyOn(spectator.component, 'onOpenNewModal');

    spectator.component.onOpenDuplicateModal();
    expect(onOpenDuplicateModalSpy).toHaveBeenCalledTimes(1);
    expect(onOpenNewModalSpy).toHaveBeenCalledTimes(1);
  });

  it('should call onRestore()', () => {
    spectator.fixture.ngZone?.run(() => {
      const onRestoreSpy = jest.spyOn(spectator.component, 'onRestore');
      spectator.component.onRestore();
      expect(onRestoreSpy).toHaveBeenCalledTimes(1);
      spectator.setInput({
        loading: true,
      });
      spectator.component.onRestore();
      expect(onRestoreSpy).toHaveBeenCalledTimes(2);
    });
  });
});
