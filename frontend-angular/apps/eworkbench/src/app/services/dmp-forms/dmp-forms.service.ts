/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '@environments/environment';
import { DMPForm } from '@eworkbench/types';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DMPFormsService {
  public readonly apiUrl = `${environment.apiUrl}/dmpforms/`;

  public constructor(private readonly httpClient: HttpClient) {}

  public getList(): Observable<DMPForm[]> {
    return this.httpClient.get<DMPForm[]>(this.apiUrl);
  }

  public get(id: string): Observable<DMPForm> {
    return this.httpClient.get<DMPForm>(`${this.apiUrl}${id}/`);
  }
}
