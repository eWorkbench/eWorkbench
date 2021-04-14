/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import { Dashboard } from '@eworkbench/types';

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  public readonly apiUrl = `${environment.apiUrl}/my/dashboard/`;

  public constructor(private readonly httpClient: HttpClient) {}

  public get(): Observable<Dashboard> {
    return this.httpClient.get<Dashboard>(this.apiUrl);
  }
}
