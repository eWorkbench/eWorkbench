/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '@environments/environment';
import type { LabBookSection, LabBookSectionPayload, LockService } from '@eworkbench/types';
import type { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LabBookSectionsService implements LockService {
  public readonly apiUrl = `${environment.apiUrl}/labbooksections/`;

  public constructor(private readonly httpClient: HttpClient) {}

  public add(labbookSection: LabBookSectionPayload): Observable<LabBookSection> {
    return this.httpClient.post<LabBookSection>(this.apiUrl, labbookSection);
  }

  public get(id: string, params = new HttpParams()): Observable<LabBookSection> {
    return this.httpClient.get<LabBookSection>(`${this.apiUrl}${id}/`, { params });
  }

  public patch(id: string, labbookSection: LabBookSectionPayload): Observable<LabBookSection> {
    return this.httpClient.patch<LabBookSection>(`${this.apiUrl}${id}/`, labbookSection);
  }

  public lock(id: string, params = new HttpParams()): Observable<void> {
    return this.httpClient.post<void>(`${this.apiUrl}${id}/lock/`, undefined, { params });
  }

  public unlock(id: string, params = new HttpParams()): Observable<void> {
    return this.httpClient.post<void>(`${this.apiUrl}${id}/unlock/`, undefined, { params });
  }
}
