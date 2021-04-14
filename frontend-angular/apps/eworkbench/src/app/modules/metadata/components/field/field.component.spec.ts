/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { LoadingModule } from '@app/modules/loading/loading.module';
import { getTranslocoModule } from '@app/transloco-testing.module';
import { FormsModule } from '@eworkbench/forms';
import { mockMetadata } from '@eworkbench/mocks';
import { ModalsModule } from '@eworkbench/modals';
import { WysiwygEditorModule } from '@eworkbench/wysiwyg-editor';
import { FormBuilder } from '@ngneat/reactive-forms';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { MetadataFieldComponent } from './field.component';

describe('MetadataFieldComponent', () => {
  let spectator: Spectator<MetadataFieldComponent>;
  const createComponent = createComponentFactory({
    component: MetadataFieldComponent,
    imports: [FormsModule, getTranslocoModule(), WysiwygEditorModule, LoadingModule, ModalsModule],
    providers: [FormBuilder],
  });

  beforeEach(() => (spectator = createComponent()));

  it('should create', () => {
    expect(spectator).toBeTruthy();
  });

  it('should call initField() with checkbox (with a value) as base type', () => {
    spectator.component.clearAnswers();
    expect(spectator.component.answers.controls.length).toBe(0);
    spectator.setInput({
      baseType: 'checkbox',
      values: { value: true },
    });
    spectator.component.initField();
    spectator.component.onChanged();
    expect(spectator.component.answers.controls.length).toBe(1);
    expect(spectator.component.readonly).toBe(false);
  });

  it('should call initField() with checkbox (without a value) as base type', () => {
    spectator.component.clearAnswers();
    expect(spectator.component.answers.controls.length).toBe(0);
    spectator.setInput({
      baseType: 'checkbox',
    });
    spectator.component.initField();
    spectator.component.onChanged();
    expect(spectator.component.answers.controls.length).toBe(1);
    expect(spectator.component.readonly).toBe(false);
  });

  it('should call initField() with selection (without answers) as base type', () => {
    spectator.component.clearAnswers();
    expect(spectator.component.answers.controls.length).toBe(0);
    spectator.setInput({
      baseType: 'selection',
      values: {
        answers: [{ answer: 'A' }, { answer: 'B' }, { answer: 'C' }],
        single_selected: 'A',
      },
    });
    spectator.component.initField();
    spectator.component.onChanged();
    expect(spectator.component.answers.controls.length).toBe(1);
    expect(spectator.component.readonly).toBe(false);
  });

  it('should call initField() with selection (with answers) as base type', () => {
    spectator.component.clearAnswers();
    expect(spectator.component.answers.controls.length).toBe(0);
    spectator.setInput({
      baseType: 'selection',
      typeSettings: {
        answers: ['A', 'B', 'C'],
      },
      values: {
        answers: [{ answer: 'A' }, { answer: 'B' }, { answer: 'C' }],
        single_selected: 'A',
      },
    });
    spectator.component.initField();
    spectator.component.onChanged();
    expect(spectator.component.answers.controls.length).toBe(3);
    expect(spectator.component.readonly).toBe(true);
  });

  it('should call initField() with selection (with answers but without a value) as base type', () => {
    spectator.component.clearAnswers();
    expect(spectator.component.answers.controls.length).toBe(0);
    spectator.setInput({
      baseType: 'selection',
      typeSettings: {
        answers: ['A', 'B', 'C'],
      },
    });
    spectator.component.initField();
    spectator.component.onChanged();
    expect(spectator.component.answers.controls.length).toBe(3);
    expect(spectator.component.readonly).toBe(true);
  });

  it('should call initField() with checkbox selection (without answers) as base type', () => {
    spectator.component.clearAnswers();
    expect(spectator.component.answers.controls.length).toBe(0);
    spectator.setInput({
      baseType: 'selection',
      values: {
        answers: [{ answer: 'A' }, { answer: 'B' }, { answer: 'C' }],
        single_selected: 'A',
      },
    });
    spectator.component.initField();
    spectator.component.onChanged();
    expect(spectator.component.answers.controls.length).toBe(1);
    expect(spectator.component.readonly).toBe(false);
  });

  it('should call initField() with checkbox selection as base type', () => {
    spectator.component.clearAnswers();
    expect(spectator.component.answers.controls.length).toBe(0);
    spectator.setInput({
      baseType: 'selection',
      typeSettings: {
        answers: ['A', 'B', 'C'],
        multiple_select: true,
      },
      values: {
        answers: [{ answer: 'A', selected: true }, { answer: 'B' }, { answer: 'C', selected: true }],
      },
    });
    spectator.component.initField();
    spectator.component.onChanged();
    expect(spectator.component.answers.controls.length).toBe(3);
    expect(spectator.component.readonly).toBe(true);
  });

  it('should call initField() with fraction as base type', () => {
    spectator.component.clearAnswers();
    expect(spectator.component.answers.controls.length).toBe(0);
    spectator.setInput({
      baseType: 'fraction',
      values: {
        numerator: 1,
        denominator: 3,
      },
    });
    spectator.component.initField();
    spectator.component.onChanged();
    expect(spectator.component.answers.controls.length).toBe(2);
    expect(spectator.component.readonly).toBe(false);
  });

  it('should call initField() with gps as base type', () => {
    spectator.component.clearAnswers();
    expect(spectator.component.answers.controls.length).toBe(0);
    spectator.setInput({
      baseType: 'gps',
      values: {
        x: '14.234654',
        y: '43.273865',
      },
    });
    spectator.component.initField();
    spectator.component.onChanged();
    expect(spectator.component.answers.controls.length).toBe(2);
    expect(spectator.component.readonly).toBe(false);
  });

  it('should call initField() with date as base type', () => {
    spectator.component.clearAnswers();
    expect(spectator.component.answers.controls.length).toBe(0);
    spectator.setInput({
      baseType: 'date',
      values: {
        value: '2020-08-31 10:02',
      },
    });
    spectator.component.initField();
    spectator.component.onChanged();
    expect(spectator.component.answers.controls.length).toBe(1);
    expect(spectator.component.readonly).toBe(false);
    expect(spectator.component.datepicker).toBe(true);
  });

  it('should call initField() with time (correct) as base type', () => {
    spectator.component.clearAnswers();
    expect(spectator.component.answers.controls.length).toBe(0);
    spectator.setInput({
      baseType: 'time',
      values: {
        value: 120,
      },
    });
    spectator.component.initField();
    spectator.component.onChanged();
    expect(spectator.component.answers.controls.length).toBe(1);
    expect(spectator.component.readonly).toBe(false);
    expect(spectator.component.datepicker).toBe(true);
  });

  it('should call initField() with time (incorrect) as base type', () => {
    spectator.component.clearAnswers();
    expect(spectator.component.answers.controls.length).toBe(0);
    spectator.setInput({
      baseType: 'time',
      values: {
        value: '2:00',
      },
    });
    spectator.component.initField();
    spectator.component.onChanged();
    expect(spectator.component.answers.controls.length).toBe(1);
    expect(spectator.component.readonly).toBe(false);
    expect(spectator.component.datepicker).toBe(true);
  });

  it('should call showCheckbox()', () => {
    spectator.setInput({
      baseType: 'checkbox',
    });
    expect(spectator.component.showCheckbox()).toBe(true);

    spectator.setInput({
      baseType: 'selection',
      typeSettings: {
        multiple_select: true,
      },
    });
    expect(spectator.component.showCheckbox()).toBe(true);

    spectator.setInput({
      baseType: 'selection',
      typeSettings: {
        multiple_select: false,
      },
    });
    expect(spectator.component.showCheckbox()).toBe(false);

    spectator.setInput({
      baseType: 'selection',
    });
    expect(spectator.component.showCheckbox()).toBe(false);

    spectator.setInput({
      baseType: 'text',
    });
    expect(spectator.component.showCheckbox()).toBe(false);
  });

  it('should call showRadio()', () => {
    spectator.setInput({
      baseType: 'checkbox',
    });
    expect(spectator.component.showCheckbox()).toBe(true);

    spectator.setInput({
      baseType: 'selection',
      typeSettings: {
        multiple_select: true,
      },
    });
    expect(spectator.component.showCheckbox()).toBe(true);

    spectator.setInput({
      baseType: 'selection',
      typeSettings: {
        multiple_select: false,
      },
    });
    expect(spectator.component.showCheckbox()).toBe(false);

    spectator.setInput({
      baseType: 'selection',
    });
    expect(spectator.component.showCheckbox()).toBe(false);
  });

  it('should call toggleSelection()', () => {
    expect(spectator.component.selectedValues).toEqual([]);
    spectator.component.toggleSelection('test');
    expect(spectator.component.selectedValues).toEqual(['test']);
    spectator.component.toggleSelection('test2');
    expect(spectator.component.selectedValues).toEqual(['test', 'test2']);
    spectator.component.toggleSelection('test');
    expect(spectator.component.selectedValues).toEqual(['test2']);
    spectator.component.toggleSelection();
    expect(spectator.component.selectedValues).toEqual(['test2']);
  });

  it('should call onChanged()', () => {
    const onChangedSpy = spyOn(spectator.component, 'onChanged').and.callThrough();

    spectator.setInput({
      baseType: 'decimal',
    });
    spectator.component.onChanged();
    expect(onChangedSpy).toHaveBeenCalledTimes(1);

    spectator.setInput({
      baseType: 'selection',
    });
    spectator.component.onChanged();
    expect(onChangedSpy).toHaveBeenCalledTimes(2);

    spectator.setInput({
      baseType: 'selection',
      typeSettings: {
        multiple_select: true,
      },
    });
    spectator.component.onChanged();
    expect(onChangedSpy).toHaveBeenCalledTimes(3);

    spectator.setInput({
      baseType: 'selection',
      typeSettings: {
        multiple_select: true,
      },
    });
    spectator.component.selectedValues = ['test'];
    spectator.component.onChanged('test');
    expect(onChangedSpy).toHaveBeenCalledTimes(4);
    expect(onChangedSpy).toHaveBeenCalledWith('test');
  });

  it('should call resetField()', () => {
    spectator.setInput({
      baseType: 'selection',
      uuid: '5ea5649a-6930-4554-b972-8235da883fbb',
      id: 'e22cf025-c10f-4097-aef7-d9ea9a802562',
      values: {
        answers: [{ answer: 'A' }, { answer: 'B' }, { answer: 'C' }],
        single_selected: 'A',
      },
      typeSettings: {
        final: true,
        answers: ['A', 'B', 'C'],
        multiple_select: false,
      },
    });
    spectator.component.initField();
    spectator.component.onChanged();

    spectator.setInput({ singleSelected: 'B' });
    spectator.component.resetField({ ...mockMetadata.field_info, values: { ...spectator.component.values } });
    expect(spectator.component.singleSelected).toBe('A');
  });

  it('should call toggleSingleSelection()', () => {
    const toggleSingleSelectionSpy = spyOn(spectator.component, 'toggleSingleSelection').and.callThrough();

    spectator.component.toggleSingleSelection();
    expect(toggleSingleSelectionSpy).toBeCalledTimes(1);
    expect(toggleSingleSelectionSpy).toBeCalledWith();
    expect(spectator.component.singleSelected).toBeUndefined();

    spectator.component.toggleSingleSelection('test');
    expect(spectator.component.singleSelected).toBe('test');
    expect(toggleSingleSelectionSpy).toBeCalledTimes(2);
    expect(toggleSingleSelectionSpy).toBeCalledWith('test');
  });
});
