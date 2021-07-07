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
import { AlertModule } from 'ngx-bootstrap/alert';
import { of } from 'rxjs';
import { ForgotPasswordPageComponent } from './forgot-password-page.component';

describe('ForgotPasswordPageComponent', () => {
  let spectator: Spectator<ForgotPasswordPageComponent>;
  const createComponent = createComponentFactory({
    component: ForgotPasswordPageComponent,
    imports: [
      HeaderModule,
      FormsModule,
      RouterTestingModule,
      getTranslocoModule(),
      AlertModule.forRoot(),
      HttpClientModule,
      FormHelperModule,
    ],
    providers: [
      mockProvider(PasswordService, {
        request: () => of(mockPasswordServiceResponse),
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

  it('should call onForgotPassword()', () => {
    spectator.component.form.controls.email.setValue('alias@domain.com');

    const onForgotPasswordSpy = jest.spyOn(spectator.component, 'onForgotPassword');
    spectator.component.onForgotPassword();
    expect(onForgotPasswordSpy).toHaveBeenCalledTimes(1);

    spectator.setInput({
      loading: true,
    });
    spectator.component.onForgotPassword();
    expect(onForgotPasswordSpy).toHaveBeenCalledTimes(2);
  });

  it('should call onForgotPassword() with an invalid form', () => {
    const onForgotPasswordSpy = jest.spyOn(spectator.component, 'onForgotPassword');
    spectator.component.onForgotPassword();
    expect(onForgotPasswordSpy).toHaveBeenCalledTimes(1);
  });
});
