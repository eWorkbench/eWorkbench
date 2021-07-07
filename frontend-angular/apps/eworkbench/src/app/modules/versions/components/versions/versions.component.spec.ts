/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpClientModule } from '@angular/common/http';
import { inject } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ModalState } from '@app/enums/modal-state.enum';
import { SharedModule } from '@app/modules/shared/shared.module';
import { UserModule } from '@app/modules/user/user.module';
import { getTranslocoModule } from '@app/transloco-testing.module';
import { FormsModule } from '@eworkbench/forms';
import { IconsModule } from '@eworkbench/icons';
import { MockService } from '@eworkbench/mocks';
import { ModalsModule } from '@eworkbench/modals';
import { SkeletonsModule } from '@eworkbench/skeletons';
import { TableModule } from '@eworkbench/table';
import { WysiwygEditorModule } from '@eworkbench/wysiwyg-editor';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { ToastrService } from 'ngx-toastr';
import { VersionsComponent } from './versions.component';

describe('VersionsComponent', () => {
  let spectator: Spectator<VersionsComponent>;
  const createComponent = createComponentFactory({
    component: VersionsComponent,
    imports: [
      HttpClientModule,
      RouterTestingModule,
      getTranslocoModule(),
      ModalsModule,
      TableModule,
      FormsModule,
      SharedModule,
      UserModule,
      WysiwygEditorModule,
      IconsModule,
      SkeletonsModule,
    ],
    providers: [MockService],
    mocks: [ToastrService],
  });

  beforeEach(() => (spectator = createComponent()));

  beforeEach(inject([MockService], (service: MockService) => {
    spectator.setInput({
      versionId: '5b8487ec-06e6-4c17-8138-50689a1c1b76',
      service: service,
    });
  }));

  it('should create', () => {
    expect(spectator).toBeTruthy();
  });

  it('should call updateVersionInProgress()', () => {
    spectator.component.updateVersionInProgress();
    expect(spectator.component.versionInProgress).toBe(1);
    spectator.setInput({
      data: [{ created_at: '2020-06-25T11:01:42.059923+02:00' }],
      lastModifiedAt: '2020-06-25T11:01:42.059923+02:00',
    });
    spectator.component.updateVersionInProgress();
    expect(spectator.component.versionInProgress).toBeNull();
    spectator.setInput({
      lastModifiedAt: '2020-06-25T11:02:43.059923+02:00',
    });
    spectator.component.updateVersionInProgress();
    expect(spectator.component.versionInProgress).toBe(2);
  });

  it('should call onModalClose()', () => {
    const onModalCloseSpy = jest.spyOn(spectator.component, 'onModalClose');
    spectator.component.onModalClose({ state: ModalState.Unchanged });
    expect(onModalCloseSpy).toHaveBeenCalledWith({ state: ModalState.Unchanged });
    expect(onModalCloseSpy).toHaveBeenCalledTimes(1);
    spectator.component.onModalClose({ state: ModalState.Changed });
    expect(onModalCloseSpy).toHaveBeenCalledWith({ state: ModalState.Changed });
    expect(onModalCloseSpy).toHaveBeenCalledTimes(2);
  });

  it('should call appendVersionInProgress()', () => {
    spectator.setInput({
      data: [],
      versionInProgress: null,
    });
    spectator.component.appendVersionInProgress();
    expect(spectator.component.data).toEqual([]);
    spectator.setInput({
      versionInProgress: 1,
    });
    spectator.component.appendVersionInProgress();
    expect(spectator.component.data).toEqual([{ number: 1 }]);
  });

  it('should call getLastVersion()', () => {
    spectator.setInput({
      data: [],
    });
    expect(spectator.component.getLastVersion()).toBeNull();
    spectator.setInput({
      data: [{}],
    });
    spectator.component.data = [{}];
    expect(spectator.component.getLastVersion()).toEqual({});
  });

  it('should call isLastVersionModified()', () => {
    spectator.setInput({
      data: [],
    });
    expect(spectator.component.isLastVersionModified()).toBe(false);
    spectator.setInput({
      data: [{ created_at: '2020-06-25T11:01:42.059923+02:00' }],
      lastModifiedAt: '2020-06-25T11:01:42.059923+02:00',
    });
    expect(spectator.component.isLastVersionModified()).toBe(false);
    spectator.setInput({
      lastModifiedAt: '2020-06-25T11:02:42.059923+02:00',
    });
    expect(spectator.component.isLastVersionModified()).toBe(true);
    spectator.setInput({
      data: [],
      lastModifiedAt: undefined as any,
    });
    expect(spectator.component.isLastVersionModified()).toBe(false);
  });
});
