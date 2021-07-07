/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '@environments/environment';
import { Appointment, ExportLink, Task } from '@eworkbench/types';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class MyScheduleService {
  public readonly apiUrl = `${environment.apiUrl}/my/schedule/`;

  public constructor(private readonly httpClient: HttpClient) {}

  public getList(params = new HttpParams()): Observable<(Appointment | Task)[]> {
    return this.httpClient.get<(Appointment | Task)[]>(this.apiUrl, { params });
  }

  public export(): Observable<ExportLink> {
    return this.httpClient.get<ExportLink>(`${this.apiUrl}get_export_link/`);
  }
}
