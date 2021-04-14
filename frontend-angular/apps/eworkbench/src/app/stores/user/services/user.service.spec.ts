/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpParams } from '@angular/common/http';
import { environment } from '@environments/environment';
import { mockExternalUser, mockUser, mockUserProfileInfo, mockUserState } from '@eworkbench/mocks';
import { createHttpFactory, HttpMethod, mockProvider, SpectatorHttp } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { UserQuery } from '../queries/user.query';
import { UserService } from './user.service';

describe('UserService', () => {
  let spectator: SpectatorHttp<UserService>;
  const createHttp = createHttpFactory({
    service: UserService,
    providers: [
      mockProvider(UserQuery, {
        user$: of(mockUserState),
      }),
      mockProvider(UserService, {
        search: () => of(mockUser),
        inviteUser: () => of(mockExternalUser),
        get: () => of(mockUser),
        put: () => of(mockUser),
        changePassword: () => {},
      }),
    ],
  });

  beforeEach(() => (spectator = createHttp()));

  it('should be created', () => {
    expect(spectator).toBeTruthy();
  });

  it('should get back a user', () => {
    spectator.service.get$.subscribe(val => expect(val).toEqual(mockUserState));
  });

  it('should login and return a user', () => {
    spectator.service.login('test', 'test').subscribe(val => expect(val).toEqual(mockUserState));
    spectator.expectOne(`${environment.apiUrl}/auth/login/`, HttpMethod.POST);
  });

  it('should check the token and return a user', () => {
    spectator.service.check('sometoken').subscribe(val => expect(val).toEqual(mockUserState));
    spectator.expectOne(`${environment.apiUrl}/me/`, HttpMethod.GET);
  });

  it('should log a user out', () => {
    const logoutSpy = spyOn(spectator.service, 'logout').and.callThrough();
    spectator.service.logout();
    expect(logoutSpy).toHaveBeenCalledTimes(1);
  });

  it('should search a user', () => {
    spectator.service.search('user').subscribe(val => expect(val).toEqual(mockUser));
    spectator.expectOne(`${environment.apiUrl}/users/?search=user`, HttpMethod.GET);
  });

  it('should search a user with access user', () => {
    spectator.service.search('user', 1).subscribe(val => expect(val).toEqual(mockUser));
    spectator.expectOne(`${environment.apiUrl}/users/?search=user&access_user=1`, HttpMethod.GET);
  });

  it('should search a user with access user and base params', () => {
    spectator.service.search('user', 1, new HttpParams().set('test', 'true')).subscribe(val => expect(val).toEqual(mockUser));
    spectator.expectOne(`${environment.apiUrl}/users/?test=true&search=user&access_user=1`, HttpMethod.GET);
  });

  it('should invite an external user', () => {
    spectator.service.inviteUser({} as any).subscribe(val => expect(val).toEqual(mockExternalUser));
    spectator.expectOne(`${environment.apiUrl}/users/invite_user/`, HttpMethod.POST);
  });

  it('should get profile data', () => {
    spectator.service.get().subscribe(val => expect(val).toEqual(mockUser));
    spectator.expectOne(spectator.service.apiUrl, HttpMethod.GET);
  });

  it('should update profile data', () => {
    spectator.service.put(mockUser).subscribe(val => expect(val).toEqual(mockUser));
    spectator.expectOne(spectator.service.apiUrl, HttpMethod.PUT);
  });

  it('should change the password', () => {
    spectator.service.changePassword('password').subscribe();
    spectator.expectOne(`${spectator.service.apiUrl}change_password/`, HttpMethod.PUT);
  });

  it('should change the dialog settings', () => {
    spectator.service
      .changeSettings({
        userprofile: {
          ui_settings: mockUser.userprofile.ui_settings,
        },
      })
      .subscribe();
    spectator.expectOne(spectator.service.apiUrl, HttpMethod.PUT);
  });

  it('should update the avatar', () => {
    spectator.service.updateAvatar(new File([], 'avatar.jpg')).subscribe(data => expect(data).toEqual(mockUser));
    spectator.expectOne(`${spectator.service.apiUrl}update_avatar/`, HttpMethod.PUT);
  });

  it('should get user profile info', () => {
    spectator.service.getUserProfileInfo().subscribe(data => expect(data).toEqual(mockUserProfileInfo));
    spectator.expectOne(`${spectator.service.userProfileInfoUrl}`, HttpMethod.GET);
  });
});
