/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Injectable } from '@angular/core';
import { set } from 'date-fns';

@Injectable({
  providedIn: 'root',
})
export class DateService {
  public fixFullDay(date: string): string {
    let fixedDate = new Date(Date.parse(date));

    // Move end date only if it's not already at 0:00:00.000
    if (fixedDate.getHours() !== 0 || fixedDate.getMinutes() !== 0 || fixedDate.getSeconds() !== 0 || fixedDate.getMilliseconds() !== 0) {
      fixedDate.setDate(fixedDate.getDate() + 1);
      fixedDate = set(fixedDate, { hours: 0, minutes: 0, seconds: 0, milliseconds: 0 });
    }

    return fixedDate.toISOString();
  }
}
