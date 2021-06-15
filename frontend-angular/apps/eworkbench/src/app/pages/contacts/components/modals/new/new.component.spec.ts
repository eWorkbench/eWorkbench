/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { DetailsDropdownModule } from '@app/modules/details-dropdown/details-dropdown.module';
import { FormHelperModule } from '@app/modules/form-helper/form-helper.module';
import { LoadingModule } from '@app/modules/loading/loading.module';
import { ContactsService, ProjectsService } from '@app/services';
import { getTranslocoModule } from '@app/transloco-testing.module';
import { FormsModule } from '@eworkbench/forms';
import { mockContact, mockProject, mockUser } from '@eworkbench/mocks';
import { ModalsModule } from '@eworkbench/modals';
import { DialogRef } from '@ngneat/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import Chance from 'chance';
import { ToastrService } from 'ngx-toastr';
import { of, Subject } from 'rxjs';
import { NewContactModalComponent } from './new.component';

describe('NewContactModalComponent', () => {
  let spectator: Spectator<NewContactModalComponent>;
  let chance: Chance.Chance;
  const createComponent = createComponentFactory({
    component: NewContactModalComponent,
    imports: [
      ModalsModule,
      FormsModule,
      HttpClientTestingModule,
      getTranslocoModule(),
      LoadingModule,
      DetailsDropdownModule,
      FormHelperModule,
    ],
    providers: [
      mockProvider(ContactsService, {
        add: () => of(mockContact),
      }),
      mockProvider(ProjectsService, {
        get: () => of(mockProject),
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

  beforeEach(() => (chance = new Chance()));

  it('should create', () => {
    expect(spectator).toBeTruthy();
  });

  it('should add a new contact', () => {
    const onSubmitSpy = spyOn(spectator.component, 'onSubmit').and.callThrough();

    spectator.component.form.controls.firstName.setValue(chance.string({ alpha: true, symbols: false }));
    spectator.component.form.controls.lastName.setValue(chance.string({ alpha: true, symbols: false }));
    spectator.component.onSubmit();
    expect(onSubmitSpy).toHaveBeenCalledTimes(1);

    spectator.component.form.controls.academicTitle.setValue(chance.string({ alpha: true, symbols: false }));
    spectator.component.form.controls.email.setValue(chance.string({ alpha: true, symbols: false }));
    spectator.component.form.controls.phone.setValue(chance.string({ numeric: true, symbols: false }));
    spectator.component.form.controls.company.setValue(chance.string({ alpha: true, symbols: false }));
    spectator.component.loading = false;
    spectator.component.onSubmit();
    expect(onSubmitSpy).toHaveBeenCalledTimes(2);
  });

  it('should add a new contact with full details', () => {
    spectator.component.form.controls.academicTitle.setValue(chance.string({ alpha: true, symbols: false }));
    spectator.component.form.controls.firstName.setValue(chance.string({ alpha: true, symbols: false }));
    spectator.component.form.controls.lastName.setValue(chance.string({ alpha: true, symbols: false }));
    spectator.component.form.controls.email.setValue(chance.email());
    spectator.component.form.controls.phone.setValue(chance.string({ alpha: true, symbols: false }));
    spectator.component.form.controls.company.setValue(chance.string({ alpha: true, symbols: false }));

    const onSubmitSpy = spyOn(spectator.component, 'onSubmit').and.callThrough();
    spectator.component.onSubmit();
    expect(onSubmitSpy).toHaveBeenCalledTimes(1);
  });

  it('should be in loading state and not add a new contact', () => {
    spectator.setInput({
      loading: true,
    });
    const onSubmitSpy = spyOn(spectator.component, 'onSubmit').and.callThrough();
    spectator.component.onSubmit();
    expect(onSubmitSpy).toHaveBeenCalledTimes(1);
  });

  it('should patch form with initial values', () => {
    spectator.setInput({
      initialState: mockContact,
    });
    const patchFormValuesSpy = spyOn(spectator.component, 'patchFormValues').and.callThrough();
    spectator.component.patchFormValues();
    expect(patchFormValuesSpy).toHaveBeenCalledTimes(1);
  });

  it('should call changeCopyProfile()', () => {
    const user = mockUser;
    const changeCopyProfileSpy = spyOn(spectator.component, 'changeCopyProfile').and.callThrough();

    spectator.component.changeCopyProfile(user);
    expect(changeCopyProfileSpy).toHaveBeenCalledTimes(1);

    user.userprofile.email_others = null;
    user.userprofile.org_zug_mitarbeiter_lang = null;
    spectator.component.changeCopyProfile(user);
    expect(changeCopyProfileSpy).toHaveBeenCalledTimes(2);

    spectator.component.changeCopyProfile();
    expect(changeCopyProfileSpy).toHaveBeenCalledTimes(3);
  });
});
