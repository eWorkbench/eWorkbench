/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { DetailsDropdownModule } from '@app/modules/details-dropdown/details-dropdown.module';
import { FormHelperModule } from '@app/modules/form-helper/form-helper.module';
import { LoadingModule } from '@app/modules/loading/loading.module';
import { NotesService } from '@app/services';
import { getTranslocoModule } from '@app/transloco-testing.module';
import { FormsModule } from '@eworkbench/forms';
import { mockNote } from '@eworkbench/mocks';
import { ModalsModule } from '@eworkbench/modals';
import { WysiwygEditorModule } from '@eworkbench/wysiwyg-editor';
import { DialogRef } from '@ngneat/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import Chance from 'chance';
import { ToastrService } from 'ngx-toastr';
import { of, Subject } from 'rxjs';
import { NewNoteModalComponent } from './new.component';

describe('NewNoteModalComponent', () => {
  let spectator: Spectator<NewNoteModalComponent>;
  let chance: Chance.Chance;
  const createComponent = createComponentFactory({
    component: NewNoteModalComponent,
    imports: [
      ModalsModule,
      FormsModule,
      HttpClientTestingModule,
      getTranslocoModule(),
      LoadingModule,
      DetailsDropdownModule,
      WysiwygEditorModule,
      FormHelperModule,
    ],
    providers: [
      mockProvider(NotesService, {
        add: () => of(mockNote),
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

  beforeEach(() => (chance = new Chance()));

  it('should create', () => {
    expect(spectator).toBeTruthy();
  });

  it('should add a new note', () => {
    spectator.component.form.controls.subject.setValue(chance.string({ alpha: true, symbols: false }));
    spectator.component.form.controls.content.setValue(chance.string({ alpha: true, symbols: false }));

    const onSubmitSpy = spyOn(spectator.component, 'onSubmit').and.callThrough();
    spectator.component.onSubmit();
    expect(onSubmitSpy).toHaveBeenCalledTimes(1);
  });

  it('should be in loading state and not add a new note', () => {
    spectator.setInput({
      loading: true,
    });
    const onSubmitSpy = spyOn(spectator.component, 'onSubmit').and.callThrough();
    spectator.component.onSubmit();
    expect(onSubmitSpy).toHaveBeenCalledTimes(1);
  });

  it('should patch form with initial values', () => {
    spectator.setInput({
      initialState: mockNote,
    });
    const patchFormValuesSpy = spyOn(spectator.component, 'patchFormValues').and.callThrough();
    spectator.component.patchFormValues();
    expect(patchFormValuesSpy).toHaveBeenCalledTimes(1);
  });
});
