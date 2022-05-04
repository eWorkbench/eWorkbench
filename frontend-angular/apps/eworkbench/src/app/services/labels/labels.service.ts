/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '@environments/environment';
import type { LabelPayload, Label } from '@eworkbench/types';
import type { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LabelsService {
  public readonly apiUrl = `${environment.apiUrl}/element_labels/`;

  public constructor(private readonly httpClient: HttpClient) {}

  public get(): Observable<Label[]> {
    return this.httpClient.get<Label[]>(this.apiUrl);
  }

  public add(label: LabelPayload): Observable<Label> {
    return this.httpClient.post<Label>(this.apiUrl, label);
  }

  public patch(id: string, label: LabelPayload): Observable<Label> {
    return this.httpClient.patch<Label>(`${this.apiUrl}${id}`, { pk: id, ...label });
  }
}
