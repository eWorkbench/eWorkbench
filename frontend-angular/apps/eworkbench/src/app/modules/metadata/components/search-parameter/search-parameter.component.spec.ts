/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { LoadingModule } from '@app/modules/loading/loading.module';
import { FormsModule } from '@eworkbench/forms';
import { IconsModule } from '@eworkbench/icons';
import { mockMetadataField } from '@eworkbench/mocks';
import { ModalsModule } from '@eworkbench/modals';
import { WysiwygEditorModule } from '@eworkbench/wysiwyg-editor';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { MetadataFieldComponent } from '../field/field.component';
import { mockTypes } from './mocks/mock-types';
import { MetadataSearchParameterComponent } from './search-parameter.component';

describe('MetadataFieldComponent', () => {
  let spectator: Spectator<MetadataSearchParameterComponent>;
  const createComponent = createComponentFactory({
    component: MetadataSearchParameterComponent,
    declarations: [MetadataFieldComponent],
    imports: [FormsModule, WysiwygEditorModule, LoadingModule, ModalsModule, IconsModule],
  });

  beforeEach(
    () =>
      (spectator = createComponent({
        props: {
          types: mockTypes,
          initialType: 'e85cd7a0-72b1-4563-9014-f703931cd19f',
          parameter: mockMetadataField,
        },
      }))
  );

  it('should create', () => {
    expect(spectator).toBeTruthy();
  });

  it('should call onRemove()', () => {
    const onRemoveSpy = jest.spyOn(spectator.component, 'onRemove');
    spectator.component.onRemove();
    expect(onRemoveSpy).toHaveBeenCalled();
  });

  it('should call onChanged()', () => {
    const onChangedSpy = jest.spyOn(spectator.component, 'onChanged');
    spectator.component.onChanged();
    expect(onChangedSpy).toHaveBeenCalledTimes(1);
    spectator.component.onChanged('test');
    expect(onChangedSpy).toHaveBeenCalledTimes(2);
    expect(onChangedSpy).toHaveBeenCalledWith('test');
    spectator.component.onChanged(['test', 'test']);
    expect(onChangedSpy).toHaveBeenCalledTimes(3);
    expect(onChangedSpy).toHaveBeenCalledWith(['test', 'test']);
  });

  it('should call initParameter()', () => {
    ['whole_number', 'decimal_number', 'currency', 'date', 'time', 'percentage', 'fraction'].map(baseType => {
      spectator.component.parameter.base_type = baseType;
      spectator.component.initParameter();
      expect(spectator.component.operators).toEqual(spectator.component.allOperators);
    });

    ['text', 'gps', 'checkbox', 'selection'].map(baseType => {
      spectator.component.parameter.base_type = baseType;
      spectator.component.initParameter();
      expect(spectator.component.operators).toEqual(spectator.component.equalOperator);
    });
  });

  it('should call onChangeType()', () => {
    const onChangeTypeSpy = jest.spyOn(spectator.component, 'onChangeType');
    spectator.component.onChangeType();
    expect(onChangeTypeSpy).toHaveBeenCalled();
  });
});
