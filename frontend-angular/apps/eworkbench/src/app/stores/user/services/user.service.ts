/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '@environments/environment';
import { ExternalUserPayload, User, UserProfileInfo } from '@eworkbench/types';
import { Observable, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { UserQuery } from '../queries/user.query';
import { UserState, UserStore } from '../stores/user.store';

@Injectable({ providedIn: 'root' })
export class UserService {
  public constructor(
    private readonly userQuery: UserQuery,
    private readonly userStore: UserStore,
    private readonly httpClient: HttpClient
  ) {}

  public readonly apiUrl = `${environment.apiUrl}/me/`;

  public readonly userProfileInfoUrl = `${environment.apiUrl}/cms/json/userprofile_info/`;

  public get get$(): Observable<UserState> {
    return this.userQuery.user$;
  }

  private set(user: User | null, token: string | null): Observable<unknown> {
    /* istanbul ignore next */
    if (token) {
      localStorage.setItem('token', token);
      /* istanbul ignore next */
    } else {
      localStorage.removeItem('token');
    }
    /* istanbul ignore next */
    return this.userStore.update(/* istanbul ignore next */ () => ({ user, token, loggedIn: Boolean(user) }));
  }

  public login(username: string, password: string): Observable<UserState> {
    return this.httpClient
      .post<{ token: string }>(`${environment.apiUrl}/auth/login/`, { username, password })
      .pipe(
        map(/* istanbul ignore next */ res => res.token),
        switchMap(/* istanbul ignore next */ (token: string) => this.check(token)),
        catchError(/* istanbul ignore next */ (error: HttpErrorResponse) => throwError(error))
      );
  }

  public logout(): void {
    this.set(null, null);
  }

  public check(token: string): Observable<UserState> {
    return this.httpClient
      .get<User>(this.apiUrl, {
        headers: {
          Authorization: `Token ${token}`,
        },
      })
      .pipe(
        map(/* istanbul ignore next */ user => this.set(user, token)),
        switchMap(/* istanbul ignore next */ () => this.get$),
        catchError(/* istanbul ignore next */ (error: HttpErrorResponse) => throwError(error))
      );
  }

  public search(search: string, accessUser?: number, params?: HttpParams): Observable<User[]> {
    const baseParams = params ?? new HttpParams();
    let searchParams = baseParams.set('search', search);
    if (accessUser) searchParams = searchParams.append('access_user', accessUser.toString());
    return this.httpClient.get<User[]>(`${environment.apiUrl}/users/`, { params: searchParams });
  }

  public inviteUser(payload: ExternalUserPayload): Observable<User> {
    return this.httpClient.post<User>(`${environment.apiUrl}/users/invite_user/`, payload);
  }

  public get(): Observable<User> {
    return this.httpClient.get<User>(this.apiUrl).pipe(
      map(user => {
        this.userStore.update({ user });
        return user;
      })
    );
  }

  public put(user: User): Observable<User> {
    return this.httpClient.put<User>(this.apiUrl, user).pipe(
      map(user => {
        this.userStore.update({ user });
        return user;
      })
    );
  }

  public changePassword(password: string): Observable<any> {
    return this.httpClient.put<any>(`${this.apiUrl}change_password/`, { password });
  }

  public changeSettings(settings: any): Observable<User> {
    return this.httpClient.put<User>(this.apiUrl, settings).pipe(
      map(user => {
        this.userStore.update({ user });
        return user;
      })
    );
  }

  public updateAvatar(avatar: File): Observable<any> {
    const formData = new FormData();
    formData.append('avatar', avatar);
    return this.httpClient.put<User>(`${this.apiUrl}update_avatar/`, formData);
  }

  public getUserProfileInfo(): Observable<UserProfileInfo> {
    return this.httpClient.get<UserProfileInfo>(this.userProfileInfoUrl);
  }
}
