/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { getTranslocoModule } from '@app/transloco-testing.module';
import { FormsModule } from '@eworkbench/forms';
import { IconsModule } from '@eworkbench/icons';
import { mockAppointment, mockContact, mockUser } from '@eworkbench/mocks';
import { TableModule } from '@eworkbench/table';
import { RelationPayload } from '@eworkbench/types';
import { FormArray } from '@ngneat/reactive-forms';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { SearchContentComponent } from './search-content.component';

describe('SearchContentComponent', () => {
  let spectator: Spectator<SearchContentComponent>;
  const createComponent = createComponentFactory({
    component: SearchContentComponent,
    imports: [getTranslocoModule(), HttpClientTestingModule, TableModule, FormsModule, IconsModule],
  });

  beforeEach(
    () =>
      (spectator = createComponent({ props: { listColumns: [], baseModel: mockContact, formArray: new FormArray<RelationPayload>([]) } }))
  );

  it('should create', () => {
    expect(spectator).toBeTruthy();
  });

  it('should call initDetails()', () => {
    const initDetailsSpy = spyOn(spectator.component, 'initDetails').and.callThrough();
    spectator.component.initDetails();
    expect(initDetailsSpy).toHaveBeenCalledTimes(1);

    spectator.setInput({ currentUser: mockUser });
    spectator.component.initDetails();
    expect(initDetailsSpy).toHaveBeenCalledTimes(2);
  });

  it('should call onChangeSelection()', () => {
    const onChangeSelectionSpy = spyOn(spectator.component, 'onChangeSelection').and.callThrough();
    spectator.component.onChangeSelection({ target: { checked: true } }, mockAppointment);
    expect(onChangeSelectionSpy).toHaveBeenCalledTimes(1);

    spectator.component.onChangeSelection({ target: { checked: false } }, mockAppointment);
    expect(onChangeSelectionSpy).toHaveBeenCalledTimes(2);
  });

  it('should call isSelected()', () => {
    const isSelectedSpy = spyOn(spectator.component, 'isSelected').and.callThrough();
    spectator.setInput({ selectedContent: [mockAppointment.pk] });
    expect(spectator.component.isSelected(mockAppointment.pk)).toBe(true);
    expect(isSelectedSpy).toHaveBeenCalledTimes(1);

    expect(spectator.component.isSelected('d09f27fe-9ab4-4c72-949c-741855010d38')).toBe(false);
    expect(isSelectedSpy).toHaveBeenCalledTimes(2);
  });
});
