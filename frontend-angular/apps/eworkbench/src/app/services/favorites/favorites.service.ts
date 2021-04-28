/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '@environments/environment';
import { Favorite } from '@eworkbench/types';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class FavoritesService {
  public readonly apiUrl = `${environment.apiUrl}/favourites/`;

  public constructor(private readonly httpClient: HttpClient) {}

  public add(id: string, contentType: number): Observable<Favorite<any>> {
    return this.httpClient.post<Favorite<any>>(this.apiUrl, {
      object_id: id,
      content_type_pk: contentType,
    });
  }

  public delete(id: string, contentType: number): Observable<void> {
    const params = new HttpParams().set('object_id', id).set('content_type_pk', contentType.toString());
    return this.httpClient.delete<void>(`${this.apiUrl}remove/`, { params });
  }
}
