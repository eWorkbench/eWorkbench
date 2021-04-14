/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Pipe, PipeTransform } from '@angular/core';
import filesize from 'filesize';

@Pipe({
  name: 'formatFileSize',
})
export class FormatFileSizePipe implements PipeTransform {
  public transform(value?: number): string {
    return value ? filesize(value) : '';
  }
}
