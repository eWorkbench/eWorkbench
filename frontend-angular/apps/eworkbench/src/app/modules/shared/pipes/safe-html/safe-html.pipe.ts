/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

@Pipe({
  name: 'safeHTML',
})
export class SafeHtmlPipe implements PipeTransform {
  public constructor(private readonly sanitizer: DomSanitizer) {}

  public transform(value: any): any {
    return this.sanitizer.bypassSecurityTrustHtml(value);
  }
}
