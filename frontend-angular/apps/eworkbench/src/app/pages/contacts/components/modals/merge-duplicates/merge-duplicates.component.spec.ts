/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { LoadingModule } from '@app/modules/loading/loading.module';
import { ContactsService, ProjectsService } from '@app/services';
import { getTranslocoModule } from '@app/transloco-testing.module';
import { FormsModule } from '@eworkbench/forms';
import { IconsModule } from '@eworkbench/icons';
import { mockContact, mockProject } from '@eworkbench/mocks';
import { ModalsModule } from '@eworkbench/modals';
import { NgSelectModule } from '@ng-select/ng-select';
import { DialogRef } from '@ngneat/dialog';
import { mockProvider } from '@ngneat/spectator';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { AlertModule } from 'ngx-bootstrap/alert';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { ToastrService } from 'ngx-toastr';
import { of, Subject } from 'rxjs';
import { MergeDuplicatesModalComponent } from './merge-duplicates.component';
import { mockContact1, mockContact2, mockContacts } from './mocks/contact';

describe('MergeDuplicatesModalComponent', () => {
  let spectator: Spectator<MergeDuplicatesModalComponent>;
  const createComponent = createComponentFactory({
    component: MergeDuplicatesModalComponent,
    imports: [
      ModalsModule,
      FormsModule,
      HttpClientTestingModule,
      getTranslocoModule(),
      LoadingModule,
      NgSelectModule,
      IconsModule,
      AlertModule,
      TooltipModule.forRoot(),
    ],
    providers: [
      mockProvider(ContactsService, {
        patch: () => of([]),
        delete: () => of([]),
        getList: () => of({ total: 1, data: [mockContact] }),
      }),
      mockProvider(ProjectsService, {
        getList: () => of({ total: 1, data: [mockProject] }),
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

  it('should create', () => {
    expect(spectator).toBeTruthy();
  });

  it('should call onChangeBaseContact()', () => {
    spectator.component.onChangeBaseContact(mockContact);
    expect(spectator.component.selectedBaseContact).toStrictEqual(mockContact);
    expect(spectator.component.academicTitles.length).toBe(1);
    expect(spectator.component.firstNames.length).toBe(1);
    expect(spectator.component.lastNames.length).toBe(1);
    expect(spectator.component.emails.length).toBe(1);
    expect(spectator.component.phones.length).toBe(1);
    expect(spectator.component.companies.length).toBe(1);
    expect(spectator.component.canMerge).toBe(false);
    spectator.component.onChangeBaseContact();
    expect(spectator.component.selectedBaseContact).toBe(undefined);
  });

  it('should call onAddMergeContact()', () => {
    expect(spectator.component.mergeContacts.value).toStrictEqual([null]);
    spectator.component.onAddMergeContact();
    expect(spectator.component.mergeContacts.value).toStrictEqual([null, null]);
  });

  it('should call onChangeMergeContact()', () => {
    spectator.component.onAddMergeContact();
    spectator.component.onChangeMergeContact(0, mockContact1);
    expect(spectator.component.selectedMergeContacts).toStrictEqual([mockContact1]);
    expect(spectator.component.canMerge).toBe(false);
    spectator.component.onChangeMergeContact(0);
    expect(spectator.component.selectedMergeContacts).toStrictEqual([]);
    expect(spectator.component.mergeContacts.length).toBe(2);
    expect(spectator.component.canMerge).toBe(false);
  });

  it('should call onRemoveMergeContact()', () => {
    spectator.component.onAddMergeContact();
    spectator.component.onRemoveMergeContact(0);
    expect(spectator.component.mergeContacts.length).toBe(1);
  });

  it('should call getUnusedContacts()', () => {
    spectator.component.onChangeBaseContact(mockContact1);
    expect(spectator.component.getUnusedContacts(mockContacts)).toStrictEqual([mockContact2]);
  });

  it('should call onMergeContacts()', () => {
    spectator.component.onChangeBaseContact(mockContact1);
    spectator.component.onAddMergeContact();
    spectator.component.onChangeMergeContact(0, mockContact2);
    const onMergeContactsSpy = spyOn(spectator.component, 'onMergeContacts').and.callThrough();
    spectator.component.onMergeContacts();
    expect(onMergeContactsSpy).toHaveBeenCalledTimes(1);
    spectator.component.onMergeContacts();
    expect(onMergeContactsSpy).toHaveBeenCalledTimes(2);
    spectator.component.onChangeBaseContact();
    spectator.component.onMergeContacts();
    expect(onMergeContactsSpy).toHaveBeenCalledTimes(3);
  });

  it('should get selectedContacts', () => {
    expect(spectator.component.selectedContacts.length).toBe(0);
    spectator.component.onChangeBaseContact(mockContact1);
    spectator.component.onChangeMergeContact(0, mockContact2);
    expect(spectator.component.selectedContacts.length).toBe(2);
  });

  it('should call setContactAsBase()', () => {
    spectator.setInput({ selectedMergeContacts: [mockContact1] });
    const setContactAsBaseSpy = spyOn(spectator.component, 'setContactAsBase').and.callThrough();
    spectator.component.setContactAsBase(0);
    expect(setContactAsBaseSpy).toHaveBeenCalledTimes(1);
    spectator.setInput({ selectedBaseContact: mockContact2 });
    spectator.component.setContactAsBase(0);
    expect(setContactAsBaseSpy).toHaveBeenCalledTimes(2);
  });
});
