/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'stripHTML',
})
export class StripHTMLPipe implements PipeTransform {
  public transform(value?: string | null): string {
    return value ? String(value).replace(/<[^>]+>/gm, '') : '';
  }
}
