/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { LoadingModule } from '@app/modules/loading/loading.module';
import { getTranslocoModule } from '@app/transloco-testing.module';
import { FormsModule } from '@eworkbench/forms';
import { IconsModule } from '@eworkbench/icons';
import { mockMetadataDecimalField } from '@eworkbench/mocks';
import { ModalsModule } from '@eworkbench/modals';
import { WysiwygEditorModule } from '@eworkbench/wysiwyg-editor';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { MetadataFieldComponent } from '../field/field.component';
import { MetadataFieldHelperComponent } from './field-helper.component';

describe('MetadataFieldHelperComponent', () => {
  let spectator: Spectator<MetadataFieldHelperComponent>;
  const createComponent = createComponentFactory({
    component: MetadataFieldHelperComponent,
    imports: [FormsModule, getTranslocoModule(), WysiwygEditorModule, LoadingModule, ModalsModule, IconsModule, TooltipModule.forRoot()],
    declarations: [MetadataFieldComponent],
  });

  beforeEach(
    () =>
      (spectator = createComponent({
        props: {
          parameter: mockMetadataDecimalField,
        },
      }))
  );

  it('should create', () => {
    expect(spectator).toBeTruthy();
  });

  it('should call showButtons()', () => {
    expect(spectator.component.showButtons()).toBe(false);
    spectator.setInput({ hasChanged: false });
    expect(spectator.component.showButtons()).toBe(false);
    spectator.setInput({ hasChanged: true });
    expect(spectator.component.showButtons()).toBe(false);
    spectator.setInput({ editable: true, hasChanged: true });
    expect(spectator.component.showButtons()).toBe(true);
  });

  it('should call onDelete()', () => {
    expect(spectator.component.deleted).toBe(false);
    expect(spectator.component.hasChanged).toBe(false);
    spectator.component.onDelete();
    expect(spectator.component.deleted).toBe(true);
    expect(spectator.component.hasChanged).toBe(true);
  });

  it('should call onCancel()', () => {
    expect(spectator.component.deleted).toBe(false);
    expect(spectator.component.hasChanged).toBe(false);

    spectator.component.onDelete();
    expect(spectator.component.deleted).toBe(true);
    expect(spectator.component.hasChanged).toBe(true);

    spectator.component.parameter.added = true;
    spectator.component.onCancel();
    expect(spectator.component.deleted).toBe(true);
    expect(spectator.component.hasChanged).toBe(true);

    spectator.component.parameter.added = false;
    spectator.component.onCancel();
    expect(spectator.component.deleted).toBe(false);
    expect(spectator.component.hasChanged).toBe(false);
  });

  it('should call onDelete()', () => {
    expect(spectator.component.deleted).toBe(false);
    expect(spectator.component.hasChanged).toBe(false);
    spectator.component.onDelete();
    expect(spectator.component.deleted).toBe(true);
    expect(spectator.component.hasChanged).toBe(true);
  });

  it('should call initFieldHelper()', () => {
    spectator.component.parameter.added = false;
    spectator.component.initFieldHelper();
    expect(spectator.component.hasChanged).toBe(false);

    spectator.component.parameter.added = true;
    spectator.component.initFieldHelper();
    expect(spectator.component.hasChanged).toBe(true);
  });

  it('should call onChanged()', () => {
    spectator.setInput({ deleted: false });
    spectator.component.onChanged();

    spectator.setInput({ deleted: true });
    spectator.component.onChanged();

    spectator.setInput({ deleted: false });

    spectator.setInput({
      initialValue: {
        ...spectator.component.initialValue,
        values: {
          value: true,
        },
      },
    });
    spectator.component.onChanged({ value: true });

    spectator.setInput({
      initialValue: {
        ...spectator.component.initialValue,
        values: {
          value: true,
        },
      },
    });
    spectator.component.onChanged({ value: false });
  });
});
