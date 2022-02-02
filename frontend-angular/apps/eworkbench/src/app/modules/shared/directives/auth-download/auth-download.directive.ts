/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpClient } from '@angular/common/http';
import { Directive, HostListener, Input } from '@angular/core';
import { lastValueFrom } from 'rxjs';

@Directive({
  selector: '[authDownload]',
})
export class AuthDownloadDirective {
  @Input('authDownload')
  public set data(data: { url: string; fileName: string }) {
    this.url = data.url;
    this.fileName = data.fileName;
  }

  public url!: string;

  public fileName!: string;

  public constructor(private readonly httpClient: HttpClient) {}

  @HostListener('click')
  public async onClick(): Promise<void> {
    const response = await lastValueFrom(this.httpClient.get(this.url, { responseType: 'blob', observe: 'response' }));
    const url = URL.createObjectURL(response.body!);
    const anchor = document.createElement('a');

    anchor.href = url;
    anchor.download = this.fileName;
    anchor.click();

    URL.revokeObjectURL(url);
  }
}
