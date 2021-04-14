/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import { Role } from '@eworkbench/types';

@Injectable({
  providedIn: 'root',
})
export class RolesService {
  public readonly apiUrl = `${environment.apiUrl}/roles/`;

  public constructor(private readonly httpClient: HttpClient) {}

  public get(): Observable<Role[]> {
    return this.httpClient.get<Role[]>(`${this.apiUrl}`);
  }
}
