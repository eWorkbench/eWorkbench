/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '@environments/environment';
import type { DjangoAPI, FAQ } from '@eworkbench/types';
import type { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class FAQService {
  public readonly apiUrl = `${environment.apiUrl}/faq/`;

  public constructor(private readonly httpClient: HttpClient) {}

  public get(params = new HttpParams()): Observable<{ total: number; data: FAQ[] }> {
    return this.httpClient.get<DjangoAPI<FAQ[]>>(this.apiUrl, { params }).pipe(
      map(data => ({
        total: data.count,
        data: data.results,
      }))
    );
  }
}
