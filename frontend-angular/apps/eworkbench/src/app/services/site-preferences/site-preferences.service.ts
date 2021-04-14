/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '@environments/environment';
import { SitePreferences } from '@eworkbench/types';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SitePreferencesService {
  public readonly apiUrl = `${environment.apiUrl}/site_preferences/`;

  public constructor(private readonly httpClient: HttpClient) {}

  public get(): Observable<SitePreferences> {
    return this.httpClient.get<SitePreferences>(this.apiUrl);
  }
}
