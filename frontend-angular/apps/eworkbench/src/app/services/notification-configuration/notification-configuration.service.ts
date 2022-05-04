/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '@environments/environment';
import type { NotificationConfiguration } from '@eworkbench/types';
import type { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class NotificationConfigurationService {
  public readonly apiUrl = `${environment.apiUrl}/notification_configuration/`;

  public constructor(private readonly httpClient: HttpClient) {}

  public get(): Observable<NotificationConfiguration> {
    return this.httpClient.get<NotificationConfiguration>(this.apiUrl);
  }

  public put(config: NotificationConfiguration): Observable<NotificationConfiguration> {
    return this.httpClient.put<NotificationConfiguration>(this.apiUrl, config);
  }
}
