/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '@environments/environment';
import type { Appointment } from '@eworkbench/types';
import type { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ResourceBookingsService {
  public readonly apiUrl = `${environment.apiUrl}/resourcebookings/`;

  public constructor(private readonly httpClient: HttpClient) {}

  public getAll(id: string, httpParams?: HttpParams): Observable<Appointment[]> {
    const baseParams = httpParams ?? new HttpParams();
    const params = baseParams.set('resource', id.toString());

    return this.httpClient.get<Appointment[]>(`${this.apiUrl}all/`, { params });
  }

  public getMine(id: string, endDate: string): Observable<Appointment[]> {
    const params = new HttpParams()
      .set('resource', id.toString())
      .set('end_date__gt', endDate)
      .set('ordering', 'attending_users')
      .set('limit', '10')
      .set('offset', '0');
    return this.httpClient.get<Appointment[]>(`${this.apiUrl}my/`, { params });
  }
}
