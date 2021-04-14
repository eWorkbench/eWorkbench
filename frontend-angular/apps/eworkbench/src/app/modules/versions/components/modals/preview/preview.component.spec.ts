/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { RouterTestingModule } from '@angular/router/testing';
import { ModalState } from '@app/enums/modal-state.enum';
import { SharedModule } from '@app/modules/shared/shared.module';
import { UserModule } from '@app/modules/user/user.module';
import { getTranslocoModule } from '@app/transloco-testing.module';
import { mockContactVersion } from '@eworkbench/mocks';
import { ModalsModule } from '@eworkbench/modals';
import { WysiwygEditorModule } from '@eworkbench/wysiwyg-editor';
import { DialogRef } from '@ngneat/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { Subject } from 'rxjs';
import { VersionsComponent } from '../../versions/versions.component';
import { VersionPreviewModalComponent } from './preview.component';

describe('VersionPreviewModalComponent', () => {
  let spectator: Spectator<VersionPreviewModalComponent>;
  const createComponent = createComponentFactory({
    component: VersionPreviewModalComponent,
    declarations: [VersionsComponent],
    imports: [getTranslocoModule(), ModalsModule, WysiwygEditorModule, SharedModule, UserModule, RouterTestingModule],
    providers: [
      mockProvider(DialogRef, {
        close: () => {},
        afterClosed$: new Subject(),
        data: {},
      }),
    ],
  });

  beforeEach(
    () =>
      (spectator = createComponent({
        props: {
          version: mockContactVersion,
        },
      }))
  );

  it('should create', () => {
    expect(spectator).toBeTruthy();
  });

  it("should show 'Restore version' in modal header", () => {
    const ngContent = spectator.query<HTMLDivElement>('.modal-header');
    expect(ngContent).toHaveText('Restore version');
  });

  it("should show 'Restore version 1' in modal header", () => {
    spectator.setInput({
      versionNumber: 1,
    });
    const ngContent = spectator.query<HTMLDivElement>('.modal-header');
    expect(ngContent).toHaveText('Restore version 1');
  });

  it('should call onModalClose()', () => {
    const onModalCloseSpy = spyOn(spectator.component, 'onModalClose').and.callThrough();
    spectator.component.onModalClose({ state: ModalState.Unchanged });
    expect(onModalCloseSpy).toHaveBeenCalledWith({ state: ModalState.Unchanged });
    expect(onModalCloseSpy).toHaveBeenCalledTimes(1);
    spectator.component.onModalClose({ state: ModalState.Changed });
    expect(onModalCloseSpy).toHaveBeenCalledWith({ state: ModalState.Changed });
    expect(onModalCloseSpy).toHaveBeenCalledTimes(2);
  });
});
