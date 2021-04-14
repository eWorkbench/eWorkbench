/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '@environments/environment';
import { ChangePassword, ForgotPassword, PasswordAPIResponse } from '@eworkbench/types';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PasswordService {
  public readonly apiUrl = `${environment.apiUrl}/auth/reset_password/`;

  public constructor(private readonly httpClient: HttpClient) {}

  public request(payload: ForgotPassword): Observable<PasswordAPIResponse> {
    return this.httpClient.post<PasswordAPIResponse>(this.apiUrl, payload);
  }

  public confirm(payload: ChangePassword): Observable<PasswordAPIResponse> {
    return this.httpClient.post<PasswordAPIResponse>(`${this.apiUrl}confirm/`, payload);
  }
}
