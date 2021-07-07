/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpClientModule } from '@angular/common/http';
import { RouterTestingModule } from '@angular/router/testing';
import { FormHelperModule } from '@app/modules/form-helper/form-helper.module';
import { HeaderModule } from '@app/modules/header/header.module';
import { PageTitleService, PasswordService } from '@app/services';
import { getTranslocoModule } from '@app/transloco-testing.module';
import { FormsModule } from '@eworkbench/forms';
import { mockPageTitle, mockPasswordServiceResponse } from '@eworkbench/mocks';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { ResetPasswordPageComponent } from './reset-password-page.component';

describe('ResetPasswordPageComponent', () => {
  let spectator: Spectator<ResetPasswordPageComponent>;
  const createComponent = createComponentFactory({
    component: ResetPasswordPageComponent,
    imports: [HeaderModule, FormsModule, RouterTestingModule, getTranslocoModule(), HttpClientModule, FormHelperModule],
    providers: [
      mockProvider(PasswordService, {
        confirm: () => of(mockPasswordServiceResponse),
      }),
      mockProvider(PageTitleService, {
        get: () => of(mockPageTitle),
      }),
    ],
  });

  beforeEach(() => (spectator = createComponent()));

  it('should create', () => {
    expect(spectator).toBeTruthy();
  });

  it('should call onChangePassword()', () => {
    spectator.component.form.controls.password.setValue('password');
    spectator.component.form.controls.passwordConfirm.setValue('password');

    const onChangePasswordSpy = jest.spyOn(spectator.component, 'onChangePassword');
    spectator.component.onChangePassword();
    expect(onChangePasswordSpy).toHaveBeenCalledTimes(1);

    spectator.setInput({
      loading: true,
    });
    spectator.component.onChangePassword();
    expect(onChangePasswordSpy).toHaveBeenCalledTimes(2);
  });
});
