/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '@environments/environment';
import type { Dashboard } from '@eworkbench/types';
import type { Observable } from 'rxjs';

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
