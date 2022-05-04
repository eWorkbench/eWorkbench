/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '@environments/environment';
import type { TableViewService } from '@eworkbench/table';
import type { ExportLink, ExportService, ResourceBooking } from '@eworkbench/types';
import type { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class MyResourceBookingsService implements TableViewService, ExportService {
  public readonly apiUrl = `${environment.apiUrl}/resourcebookings/my/`;

  public constructor(private readonly httpClient: HttpClient) {}

  public getList(params = new HttpParams()): Observable<{ total: number; data: ResourceBooking[] }> {
    return this.httpClient.get<ResourceBooking[]>(this.apiUrl, { params }).pipe(
      map(data => ({
        total: data.length,
        data,
      }))
    );
  }

  public delete(id: string, params = new HttpParams()): Observable<ResourceBooking> {
    // Only remove the resource reference from the booking and don't actually delete it
    return this.httpClient.patch<ResourceBooking>(`${this.apiUrl}${id}/`, { resource_pk: null }, { params });
  }

  public export(id: string): Observable<ExportLink> {
    return this.httpClient.get<ExportLink>(`${this.apiUrl}${id}/get_export_link/`);
  }

  public exportMany(idList: string[]): Observable<Blob> {
    return this.httpClient.get(`${this.apiUrl}export_many/${idList.join(',')}/`, { responseType: 'blob' });
  }
}
