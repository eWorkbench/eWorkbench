/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '@environments/environment';
import type { DjangoAPI, Notification } from '@eworkbench/types';
import type { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class NotificationsService {
  public readonly apiUrl = `${environment.apiUrl}/notifications/`;

  public notifications: Notification[] = [];

  public constructor(private readonly httpClient: HttpClient) {}

  public get hasUnread(): boolean {
    return this.notifications.some(notification => !notification.read);
  }

  public getList(params = new HttpParams()): Observable<{ total: number; data: Notification[] }> {
    return this.httpClient.get<DjangoAPI<Notification[]>>(this.apiUrl, { params }).pipe(
      map(data => {
        this.notifications = [...data.results];

        return {
          total: data.count,
          data: data.results,
        };
      })
    );
  }

  public get(id: string): Observable<Notification> {
    return this.httpClient.get<Notification>(`${this.apiUrl}${id}`);
  }

  public read(id: string): Observable<Notification> {
    return this.httpClient.put<Notification>(`${this.apiUrl}${id}/read/`, { pk: id });
  }

  public readAll(): Observable<void> {
    return this.httpClient.post<void>(`${this.apiUrl}read_all/`, {});
  }
}
