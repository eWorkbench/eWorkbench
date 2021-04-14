/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '@environments/environment';
import { PluginDetails, PluginFeedbackPayload } from '@eworkbench/types';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PluginsService {
  public readonly apiUrl = `${environment.apiUrl}/plugins/`;

  public constructor(private readonly httpClient: HttpClient) {}

  public get(params?: HttpParams): Observable<PluginDetails[]> {
    return this.httpClient.get<PluginDetails[]>(this.apiUrl, { params });
  }

  public feedback(feedback: PluginFeedbackPayload): Observable<void> {
    return this.httpClient.post<void>(`${this.apiUrl}feedback/`, feedback);
  }
}
