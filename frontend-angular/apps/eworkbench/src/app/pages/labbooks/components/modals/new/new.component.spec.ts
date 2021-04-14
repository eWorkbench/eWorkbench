/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { DetailsDropdownModule } from '@app/modules/details-dropdown/details-dropdown.module';
import { FormHelperModule } from '@app/modules/form-helper/form-helper.module';
import { LabBookModule } from '@app/modules/labbook/labbook.module';
import { LoadingModule } from '@app/modules/loading/loading.module';
import { MetadataModule } from '@app/modules/metadata/metadata.module';
import { LabBooksService } from '@app/services';
import { getTranslocoModule } from '@app/transloco-testing.module';
import { FormsModule } from '@eworkbench/forms';
import { ModalsModule } from '@eworkbench/modals';
import { WysiwygEditorModule } from '@eworkbench/wysiwyg-editor';
import { DialogRef } from '@ngneat/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import Chance from 'chance';
import { ToastrService } from 'ngx-toastr';
import { of, Subject } from 'rxjs';
import { mockLabBook } from './mocks/labbook';
import { NewLabBookModalComponent } from './new.component';

describe('NewLabBookModalComponent', () => {
  let spectator: Spectator<NewLabBookModalComponent>;
  let chance: Chance.Chance;
  const createComponent = createComponentFactory({
    component: NewLabBookModalComponent,
    imports: [
      ModalsModule,
      FormsModule,
      HttpClientTestingModule,
      getTranslocoModule(),
      LoadingModule,
      DetailsDropdownModule,
      WysiwygEditorModule,
      MetadataModule,
      LabBookModule,
      FormHelperModule,
    ],
    providers: [
      mockProvider(LabBooksService, {
        add: () => of(mockLabBook),
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

  it('should add a new LabBook', () => {
    spectator.component.form.controls.title.setValue(chance.string({ alpha: true, symbols: false }));
    spectator.component.form.controls.description.setValue(chance.string({ alpha: true, symbols: false }));
    const onSubmitSpy = spyOn(spectator.component, 'onSubmit').and.callThrough();
    spectator.component.onSubmit();
    expect(onSubmitSpy).toHaveBeenCalledTimes(1);
  });

  it('should be in loading state and not add a new LabBook', () => {
    spectator.setInput({
      loading: true,
    });
    const onSubmitSpy = spyOn(spectator.component, 'onSubmit').and.callThrough();
    spectator.component.onSubmit();
    expect(onSubmitSpy).toHaveBeenCalledTimes(1);
  });
});
