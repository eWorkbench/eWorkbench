/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import { Contact, SearchResult } from '@eworkbench/types';

@Injectable({
  providedIn: 'root',
})
export class SearchService {
  public readonly apiUrl = `${environment.apiUrl}/search/`;

  public constructor(private readonly httpClient: HttpClient) {}

  public contacts(search: string, params = new HttpParams()): Observable<Contact[]> {
    const httpParams = params.set('model', 'contact').set('search', search);

    return this.httpClient.get<Contact[]>(this.apiUrl, { params: httpParams });
  }

  public search(search: string, params = new HttpParams()): Observable<SearchResult[]> {
    const httpParams = params.set('search', search);

    return this.httpClient.get<SearchResult[]>(this.apiUrl, { params: httpParams });
  }
}
