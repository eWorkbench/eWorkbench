/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '@environments/environment';
import type { MetadataTag, MetadataTagPayload } from '@eworkbench/types';
import type { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class MetadataTagsService {
  public readonly apiUrl = `${environment.apiUrl}/metadata/tags/`;

  public constructor(private readonly httpClient: HttpClient) {}

  public get(params = new HttpParams()): Observable<MetadataTag[]> {
    return this.httpClient.get<MetadataTag[]>(this.apiUrl, { params });
  }

  public add(tag: MetadataTagPayload, params = new HttpParams()): Observable<MetadataTag> {
    return this.httpClient.post<MetadataTag>(this.apiUrl, tag, { params });
  }
}
