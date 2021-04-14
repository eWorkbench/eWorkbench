/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpClientModule } from '@angular/common/http';
import { fakeAsync } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { FormHelperModule } from '@app/modules/form-helper/form-helper.module';
import { HeaderModule } from '@app/modules/header/header.module';
import { AuthService, PageTitleService } from '@app/services';
import { getTranslocoModule } from '@app/transloco-testing.module';
import { FormsModule } from '@eworkbench/forms';
import { mockPageTitle, mockUser } from '@eworkbench/mocks';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { LoginPageComponent } from './login-page.component';

describe('LoginPageComponent', () => {
  let spectator: Spectator<LoginPageComponent>;
  const createComponent = createComponentFactory({
    component: LoginPageComponent,
    imports: [RouterTestingModule, HeaderModule, FormsModule, getTranslocoModule(), HttpClientModule, FormHelperModule],
    providers: [
      mockProvider(AuthService, {
        user$: of(mockUser),
        login: () => of(mockUser),
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

  it('should call onLogin()', fakeAsync(() => {
    spectator.fixture.ngZone?.run(() => {
      spectator.component.form.patchValue({
        username: 'username',
        password: 'password',
      });

      const onLoginSpy = spyOn(spectator.component, 'onLogin').and.callThrough();
      spectator.component.onLogin();
      expect(onLoginSpy).toHaveBeenCalledTimes(1);

      spectator.setInput({
        loading: true,
      });
      spectator.component.onLogin();
      expect(onLoginSpy).toHaveBeenCalledTimes(2);
    });
  }));

  it('should call onLogin() with an invalid form', fakeAsync(() => {
    spectator.fixture.ngZone?.run(() => {
      const onLoginSpy = spyOn(spectator.component, 'onLogin').and.callThrough();
      spectator.component.onLogin();
      expect(onLoginSpy).toHaveBeenCalledTimes(1);
    });
  }));
});
