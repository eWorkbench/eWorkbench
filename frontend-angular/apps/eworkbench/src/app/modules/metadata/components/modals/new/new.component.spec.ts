/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { DetailsDropdownModule } from '@app/modules/details-dropdown/details-dropdown.module';
import { FormHelperModule } from '@app/modules/form-helper/form-helper.module';
import { LoadingModule } from '@app/modules/loading/loading.module';
import { MetadataService } from '@app/services';
import { getTranslocoModule } from '@app/transloco-testing.module';
import { FormsModule } from '@eworkbench/forms';
import { mockMetadata } from '@eworkbench/mocks';
import { ModalsModule } from '@eworkbench/modals';
import { WysiwygEditorModule } from '@eworkbench/wysiwyg-editor';
import { DialogRef } from '@ngneat/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import Chance from 'chance';
import { AlertModule } from 'ngx-bootstrap/alert';
import { ToastrService } from 'ngx-toastr';
import { of, Subject } from 'rxjs';
import { NewMetadataFieldComponent } from './new.component';

describe('NewMetadataFieldComponent', () => {
  let spectator: Spectator<NewMetadataFieldComponent>;
  let chance: Chance.Chance;
  const createComponent = createComponentFactory({
    component: NewMetadataFieldComponent,
    imports: [
      ModalsModule,
      FormsModule,
      HttpClientTestingModule,
      getTranslocoModule(),
      LoadingModule,
      DetailsDropdownModule,
      WysiwygEditorModule,
      LoadingModule,
      ModalsModule,
      FormHelperModule,
      AlertModule,
    ],
    providers: [
      mockProvider(MetadataService, {
        add: () => of(mockMetadata),
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

  it('should add a new metadata field', () => {
    spectator.component.form.controls.name.setValue(chance.string({ alpha: true, symbols: false }));
    spectator.component.form.controls.description.setValue(chance.string({ alpha: true, symbols: false }));
    spectator.component.form.controls.baseType.setValue('whole_number');

    const onSubmitSpy = spyOn(spectator.component, 'onSubmit').and.callThrough();
    spectator.component.onSubmit();
    expect(onSubmitSpy).toHaveBeenCalledTimes(1);
  });

  it('should be in loading state and not add a new metadata field', () => {
    spectator.setInput({ loading: true });
    const onSubmitSpy = spyOn(spectator.component, 'onSubmit').and.callThrough();
    spectator.component.onSubmit();
    expect(onSubmitSpy).toHaveBeenCalledTimes(1);
  });

  it('should get metadata field data', () => {
    spectator.component.form.controls.name.setValue(chance.string({ alpha: true, symbols: false }));
    spectator.component.form.controls.description.setValue(chance.string({ alpha: true, symbols: false }));
    ['whole_number', 'decimal_number', 'currency', 'date', 'time', 'percentage', 'text', 'fraction', 'gps', 'checkbox', 'selection'].map(
      (baseType: string) => {
        spectator.component.form.controls.baseType.setValue(baseType);
        expect(spectator.component.metadata.base_type).toBe(baseType);
      }
    );
  });

  it('should add and remove answer fields', () => {
    expect(spectator.component.answers.length).toBe(3);
    spectator.component.onAddAnswer();
    expect(spectator.component.answers.length).toBe(4);
    spectator.component.onRemoveAnswer(0);
    expect(spectator.component.answers.length).toBe(3);
  });
});
