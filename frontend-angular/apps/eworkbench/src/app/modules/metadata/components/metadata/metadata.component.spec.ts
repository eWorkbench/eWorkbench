/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { DragDropModule } from '@angular/cdk/drag-drop';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormHelperModule } from '@app/modules/form-helper/form-helper.module';
import { LoadingComponent } from '@app/modules/loading/components/loading/loading.component';
import { LoadingModule } from '@app/modules/loading/loading.module';
import { getTranslocoModule } from '@app/transloco-testing.module';
import { FormsModule } from '@eworkbench/forms';
import { IconsModule } from '@eworkbench/icons';
import { ModalsModule } from '@eworkbench/modals';
import { WysiwygEditorModule } from '@eworkbench/wysiwyg-editor';
import { DialogRef } from '@ngneat/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { cloneDeep } from 'lodash';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { ToastrService } from 'ngx-toastr';
import { Subject } from 'rxjs';
import { MetadataFieldHelperComponent } from '../field-helper/field-helper.component';
import { MetadataFieldComponent } from '../field/field.component';
import { MetadataComponent } from './metadata.component';
import { mockMetadata, mockMetadata2, mockMetadataParamData } from './mocks/metadata';

jest.mock('@angular/cdk/drag-drop');

describe('MetadataComponent', () => {
  let spectator: Spectator<MetadataComponent>;
  const createComponent = createComponentFactory({
    component: MetadataComponent,
    declarations: [MetadataFieldHelperComponent, MetadataFieldComponent, LoadingComponent],
    imports: [
      FormsModule,
      FormHelperModule,
      getTranslocoModule(),
      HttpClientTestingModule,
      WysiwygEditorModule,
      LoadingModule,
      ModalsModule,
      DragDropModule,
      IconsModule,
      TooltipModule.forRoot(),
    ],
    providers: [
      mockProvider(DialogRef, {
        close: () => {},
        afterClosed$: new Subject(),
        data: {},
      }),
    ],
    mocks: [ToastrService],
  });

  beforeEach(() => (spectator = createComponent()));

  it('should create', () => {
    expect(spectator).toBeTruthy();
  });

  it('should call emitChanges()', () => {
    spectator.setInput({ selectedParameters: [] });
    spectator.component.emitChanges();

    spectator.setInput({ selectedParameters: [mockMetadata] });
    spectator.component.emitChanges();

    spectator.setInput({ selectedParameters: [{ ...mockMetadata, deleted: true }] });
    spectator.component.emitChanges();
  });

  it('should call refreshOrdering()', () => {
    spectator.setInput({ selectedParameters: [cloneDeep(mockMetadata), cloneDeep(mockMetadata)] });
    spectator.component.refreshOrdering();
    expect(spectator.component.selectedParameters[0].ordering).toBe(1);
    expect(spectator.component.selectedParameters[1].ordering).toBe(2);
    spectator.setInput({
      selectedParameters: [spectator.component.selectedParameters[1], spectator.component.selectedParameters[0]],
    });
    expect(spectator.component.selectedParameters[0].ordering).toBe(2);
    expect(spectator.component.selectedParameters[1].ordering).toBe(1);
    spectator.component.refreshOrdering();
    expect(spectator.component.selectedParameters[0].ordering).toBe(1);
    expect(spectator.component.selectedParameters[1].ordering).toBe(2);
  });

  it('should call onChanged()', () => {
    const onChangedSpy = jest.spyOn(spectator.component, 'onChanged');
    spectator.setInput({ selectedParameters: [cloneDeep(mockMetadata)] });

    spectator.component.onChanged(mockMetadata);
    expect(onChangedSpy).toHaveBeenCalledWith(mockMetadata);

    const mockMetadata2 = { ...mockMetadata, id: '15240d85-b034-4c3d-b6f0-d2bf85c7bcc0' };
    spectator.component.onChanged(mockMetadata2);
    expect(onChangedSpy).toHaveBeenCalledWith(mockMetadata2);
    expect(onChangedSpy).toHaveBeenCalledTimes(4);
  });

  it('should call add and remove parameters', () => {
    spectator.setInput({ parametersData: mockMetadataParamData });

    spectator.component.onAdd();
    expect(spectator.component.selectedParameters.length).toBe(0);

    spectator.component.parametersFormControl.patchValue(mockMetadata.field);
    spectator.component.onAdd();
    expect(spectator.component.selectedParameters.length).toBe(1);

    spectator.component.onAdd(mockMetadata2.field);
    expect(spectator.component.selectedParameters.length).toBe(2);

    spectator.component.onAdd(mockMetadata2.field, 0);
    expect(spectator.component.selectedParameters.length).toBe(3);

    spectator.setInput({
      selectedParameters: [
        {
          ...spectator.component.selectedParameters[0],
          id: mockMetadata2.id!,
        },
        {
          ...spectator.component.selectedParameters[1],
          id: mockMetadata.id!,
        },
        {
          ...spectator.component.selectedParameters[2],
          id: mockMetadata2.id!,
        },
      ],
    });

    spectator.component.onRemove('5df4fb04-8a89-4783-a5c1-6854a84cc86f');
    expect(spectator.component.selectedParameters.length).toBe(3);

    spectator.component.onRemove('8ce37733-6abd-4f08-a5e9-1fb92d554af4');
    expect(spectator.component.selectedParameters.length).toBe(2);
  });

  it('should call showButtons()', () => {
    expect(spectator.component.showButtons()).toBe(false);
    spectator.setInput({ hasChanged: true });
    expect(spectator.component.showButtons()).toBe(true);
  });

  // TODO: Fix test
  /* it('should call onElementDrop()', () => {
    const onElementDropSpy = jest.spyOn(spectator.component, 'onElementDrop');
    const expected = {
      previousIndex: 0,
      currentIndex: 1,
      item: {} as any,
      container: {} as any,
      previousContainer: {} as any,
      isPointerOverContainer: true,
      distance: { x: 2, y: 3 },
    };

    spectator.setInput({ parametersData: mockMetadataParamData });
    spectator.component.onAdd(mockMetadata.field);
    spectator.component.onAdd(mockMetadata2.field);
    spectator.setInput({
      selectedParameters: [
        {
          ...spectator.component.selectedParameters[0],
          id: mockMetadata.id,
        },
        {
          ...spectator.component.selectedParameters[1],
          id: mockMetadata2.id,
        },
      ],
    });

    spectator.component.onElementDrop(expected);
    expect(onElementDropSpy).toHaveBeenCalledWith(expected);
    expect(onElementDropSpy).toHaveBeenCalledTimes(1);

    expected.currentIndex = 0;
    spectator.component.onElementDrop(expected);
    expect(onElementDropSpy).toHaveBeenCalledWith(expected);
    expect(onElementDropSpy).toHaveBeenCalledTimes(2);
  }); */
});
