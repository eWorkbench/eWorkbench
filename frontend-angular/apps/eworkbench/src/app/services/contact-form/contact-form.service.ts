/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '@environments/environment';
import { ContactFormPayload } from '@eworkbench/types';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ContactFormService {
  public readonly apiUrl = `${environment.apiUrl}/contact_form/`;

  public constructor(private readonly httpClient: HttpClient) {}

  public send(contactForm: ContactFormPayload): Observable<void> {
    return this.httpClient.post<void>(this.apiUrl, { ...contactForm });
  }
}
