/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '@environments/environment';
import type { MetadataField, MetadataSearchRequestData, MetadataPayload, Metadata } from '@eworkbench/types';
import type { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class MetadataService {
  public readonly apiUrlFields = `${environment.apiUrl}/metadatafields/`;
  public readonly apiUrlSearch = `${environment.apiUrl}/metadata-search/`;

  public constructor(private readonly httpClient: HttpClient) {}

  public add(metadata: MetadataPayload): Observable<Metadata> {
    return this.httpClient.post<Metadata>(this.apiUrlFields, metadata);
  }

  public getFields(): Observable<MetadataField[]> {
    return this.httpClient.get<MetadataField[]>(this.apiUrlFields);
  }

  public search(data: MetadataSearchRequestData): Observable<any> {
    return this.httpClient.post<any>(this.apiUrlSearch, data);
  }
}
