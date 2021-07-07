/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { inject } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ModalState } from '@app/enums/modal-state.enum';
import { SharedModule } from '@app/modules/shared/shared.module';
import { UserModule } from '@app/modules/user/user.module';
import { UserStore } from '@app/stores/user';
import { getTranslocoModule } from '@app/transloco-testing.module';
import { FormsModule } from '@eworkbench/forms';
import { IconsModule } from '@eworkbench/icons';
import { MockNewModalComponent, MockService, mockUserStoreDialogFalse, mockUserStoreDialogTrue } from '@eworkbench/mocks';
import { ModalsModule } from '@eworkbench/modals';
import { TableModule } from '@eworkbench/table';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { CollapseModule } from 'ngx-bootstrap/collapse';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { ToastrService } from 'ngx-toastr';
import { LabBookElementDropdownComponent } from './element-dropdown.component';

describe('LabBookElementDropdownComponent', () => {
  let spectator: Spectator<LabBookElementDropdownComponent>;
  const createComponent = createComponentFactory({
    component: LabBookElementDropdownComponent,
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
      SharedModule,
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

  it('should call onDeleteModalClose()', () => {
    spectator.fixture.ngZone?.run(() => {
      const onDeleteModalCloseSpy = jest.spyOn(spectator.component, 'onDeleteModalClose');
      spectator.component.onDeleteModalClose({ state: ModalState.Unchanged });
      expect(onDeleteModalCloseSpy).toHaveBeenCalledWith({ state: ModalState.Unchanged });
      expect(onDeleteModalCloseSpy).toHaveBeenCalledTimes(1);
      spectator.component.onDeleteModalClose({ state: ModalState.Changed });
      expect(onDeleteModalCloseSpy).toHaveBeenCalledWith({ state: ModalState.Changed });
      expect(onDeleteModalCloseSpy).toHaveBeenCalledTimes(2);
    });
  });

  it('should call remove()', () => {
    spectator.fixture.ngZone?.run(() => {
      const removeSpy = jest.spyOn(spectator.component, 'remove');
      spectator.component.remove();
      expect(removeSpy).toHaveBeenCalledTimes(1);
      spectator.setInput({
        loading: true,
      });
      spectator.component.remove();
      expect(removeSpy).toHaveBeenCalledTimes(2);
    });
  });

  it('should open the remove modal', () => {
    spectator.fixture.ngZone?.run(() => {
      expect(spectator.component.modalRef).toBeUndefined();
      spectator.component.onRemove();
      expect(spectator.component.modalRef).toBeDefined();
    });
  });

  it('should call onRemoveModalClose()', () => {
    spectator.fixture.ngZone?.run(() => {
      const onRemoveModalCloseSpy = jest.spyOn(spectator.component, 'onRemoveModalClose');
      spectator.component.onRemoveModalClose({ state: ModalState.Unchanged });
      expect(onRemoveModalCloseSpy).toHaveBeenCalledWith({ state: ModalState.Unchanged });
      expect(onRemoveModalCloseSpy).toHaveBeenCalledTimes(1);
      spectator.component.onRemoveModalClose({ state: ModalState.Changed });
      expect(onRemoveModalCloseSpy).toHaveBeenCalledWith({ state: ModalState.Changed });
      expect(onRemoveModalCloseSpy).toHaveBeenCalledTimes(2);
    });
  });
});

describe('LabBookElementDropdownComponent', () => {
  let spectator: Spectator<LabBookElementDropdownComponent>;
  const createComponent = createComponentFactory({
    component: LabBookElementDropdownComponent,
    imports: [
      FormsModule,
      HttpClientTestingModule,
      getTranslocoModule(),
      ModalsModule,
      BsDropdownModule.forRoot(),
      CollapseModule.forRoot(),
      RouterTestingModule,
      UserModule,
      TableModule,
      TooltipModule,
      IconsModule,
      SharedModule,
    ],
    providers: [
      MockService,
      mockProvider(UserStore, {
        getValue: () => mockUserStoreDialogTrue,
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
});
