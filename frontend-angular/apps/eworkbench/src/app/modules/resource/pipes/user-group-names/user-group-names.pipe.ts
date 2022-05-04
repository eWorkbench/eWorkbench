/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Pipe, PipeTransform } from '@angular/core';
import type { UserGroup } from '@eworkbench/types';

@Pipe({
  name: 'formatUserGroupNames',
})
export class FormatUserGroupNamesPipe implements PipeTransform {
  public transform(value: UserGroup[]): string {
    let names = '';
    for (let i = 0; i < value.length; i++) {
      if (i === 0) {
        names = value[i].name;
      } else {
        names += `, ${value[i].name}`;
      }
    }
    return names;
  }
}
