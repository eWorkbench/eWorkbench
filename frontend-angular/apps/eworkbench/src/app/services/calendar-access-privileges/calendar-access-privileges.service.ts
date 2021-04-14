/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { PrivilegesService } from '@app/services/privileges/privileges.service';
import { environment } from '@environments/environment';
import {
  CalendarAccessPrivileges,
  CalendarAccessPrivilegesPayload,
  PermissionsService,
  Privileges,
  PrivilegesApi,
} from '@eworkbench/types';
import { Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class CalendarAccessPrivilegesService implements PermissionsService {
  public readonly apiUrl = `${environment.apiUrl}/calendar-access-privileges/`;

  public constructor(private readonly httpClient: HttpClient, private readonly privilegesService: PrivilegesService) {}

  public getList(params?: HttpParams): Observable<CalendarAccessPrivileges[]> {
    return this.httpClient.get<CalendarAccessPrivileges[]>(this.apiUrl, { params });
  }

  public add(
    calendarAccessPrivilegesPayload: CalendarAccessPrivilegesPayload,
    params?: HttpParams
  ): Observable<CalendarAccessPrivilegesPayload> {
    return this.httpClient.post<CalendarAccessPrivilegesPayload>(this.apiUrl, calendarAccessPrivilegesPayload, { params });
  }

  public getPrivilegesList(id: string): Observable<PrivilegesApi[]> {
    return this.httpClient.get<PrivilegesApi[]>(`${this.apiUrl}${id}/privileges/`);
  }

  public getUserPrivileges(id: string, userId: number, deleted: boolean): Observable<Privileges> {
    return this.httpClient
      .get<PrivilegesApi>(`${this.apiUrl}${id}/privileges/${userId}/`)
      .pipe(map(/* istanbul ignore next */ privileges => this.privilegesService.transform(privileges, deleted)));
  }

  public addUserPrivileges(id: string, userId: number): Observable<PrivilegesApi> {
    return this.httpClient.post<PrivilegesApi>(
      `${this.apiUrl}${id}/privileges/`,
      {
        user_pk: userId,
        view_privilege: 'AL',
      },
      {
        params: new HttpParams().set('pk', userId.toString()),
      }
    );
  }

  public putUserPrivileges(id: string, userId: number, privileges: PrivilegesApi): Observable<PrivilegesApi> {
    return this.httpClient.put<PrivilegesApi>(`${this.apiUrl}${id}/privileges/${userId}/`, privileges);
  }

  public deleteUserPrivileges(id: string, userId: number): Observable<PrivilegesApi[]> {
    return this.httpClient
      .delete(`${this.apiUrl}${id}/privileges/${userId}/`)
      .pipe(switchMap(/* istanbul ignore next */ () => this.getPrivilegesList(id)));
  }
}
