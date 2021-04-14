/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { UserService } from '@app/stores/user';
import { mockUser } from '@eworkbench/mocks';
import { createHttpFactory, mockProvider, SpectatorHttp } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let spectator: SpectatorHttp<AuthService>;
  const createService = createHttpFactory({
    service: AuthService,
    providers: [
      mockProvider(UserService, {
        get$: of(mockUser),
        login: () => of(mockUser),
      }),
    ],
  });

  beforeEach(() => (spectator = createService()));

  it('should be created', () => {
    expect(spectator).toBeTruthy();
  });

  it('should return a user', () => {
    spectator.service.user$.subscribe(val => expect(val).toEqual(mockUser));
  });

  it('should login and return a user', () => {
    const loginSpy = spyOn(spectator.service, 'login').and.callThrough();
    spectator.service.login('test', 'test').subscribe(val => expect(val).toEqual(mockUser));
    expect(loginSpy).toHaveBeenCalledTimes(1);
  });

  it('should log out the user', () => {
    const logoutSpy = spyOn(spectator.service, 'logout').and.callThrough();
    spectator.service.logout();
    expect(logoutSpy).toHaveBeenCalledTimes(1);
  });
});
