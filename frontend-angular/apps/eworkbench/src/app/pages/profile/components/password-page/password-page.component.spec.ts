/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { HeaderModule } from '@app/modules/header/header.module';
import { PageTitleService } from '@app/services';
import { UserService } from '@app/stores/user';
import { getTranslocoModule } from '@app/transloco-testing.module';
import { FormsModule } from '@eworkbench/forms';
import { mockPageTitle } from '@eworkbench/mocks';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { ToastrService } from 'ngx-toastr';
import { of } from 'rxjs';
import { ProfilePageModule } from '../../profile-page.module';
import { PasswordPageComponent } from './password-page.component';

const passwordValidators = [Validators.required, Validators.minLength(8)];

describe('PasswordPageComponent', () => {
  let spectator: Spectator<PasswordPageComponent>;
  const createComponent = createComponentFactory({
    component: PasswordPageComponent,
    imports: [ProfilePageModule, HeaderModule, FormsModule, HttpClientTestingModule, RouterTestingModule, getTranslocoModule()],
    providers: [
      mockProvider(UserService, {
        changePassword: () => of([]),
      }),
      mockProvider(PageTitleService, {
        get: () => of(mockPageTitle),
      }),
    ],
    mocks: [ToastrService],
  });

  beforeEach(() => (spectator = createComponent()));

  it('should create', () => {
    expect(spectator).toBeTruthy();
  });

  it('should call onSubmit()', () => {
    spectator.setInput({
      form: new FormGroup({
        password: new FormControl('password', passwordValidators),
        passwordConfirm: new FormControl('password', passwordValidators),
      }),
    });

    const onSubmitSpy = jest.spyOn(spectator.component, 'onSubmit');
    spectator.component.onSubmit();
    expect(onSubmitSpy).toHaveBeenCalledTimes(1);

    spectator.setInput({
      loading: true,
    });
    spectator.component.onSubmit();
    expect(onSubmitSpy).toHaveBeenCalledTimes(2);
  });

  it('should call onSubmit() with an invalid form', () => {
    spectator.setInput({
      form: new FormGroup({
        password: new FormControl('short', passwordValidators),
        passwordConfirm: new FormControl('short', passwordValidators),
      }),
    });

    const onSubmitSpy = jest.spyOn(spectator.component, 'onSubmit');
    spectator.component.onSubmit();
    expect(onSubmitSpy).toHaveBeenCalledTimes(1);
  });

  it('should call onSubmit() with different passwords', () => {
    spectator.setInput({
      form: new FormGroup({
        password: new FormControl('password1', passwordValidators),
        passwordConfirm: new FormControl('password2', passwordValidators),
      }),
    });

    const onSubmitSpy = jest.spyOn(spectator.component, 'onSubmit');
    spectator.component.onSubmit();
    expect(onSubmitSpy).toHaveBeenCalledTimes(1);
  });
});
