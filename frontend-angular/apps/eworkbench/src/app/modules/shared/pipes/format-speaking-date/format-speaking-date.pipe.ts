/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Pipe, PipeTransform } from '@angular/core';
import { TranslocoService } from '@ngneat/transloco';
import { format, parseISO, set } from 'date-fns';

@Pipe({
  name: 'formatSpeakingDate',
})
export class FormatSpeakingDatePipe implements PipeTransform {
  public constructor(private readonly translocoService: TranslocoService) {}

  public transform(
    value?: string,
    withTime = true,
    formatDayString = 'yyyy-MM-dd',
    formatTimeString = "HH':'mm",
    formatSeparator = ', '
  ): string {
    if (!value) {
      return '';
    }

    const differenceMeasure = 24 * 60 * 60 * 1000;
    const currentDate = set(new Date(), { hours: 0, minutes: 0, seconds: 0, milliseconds: 0 });
    const selectedDate = parseISO(value);
    const dateDifference = set(selectedDate, { hours: 0, minutes: 0, seconds: 0, milliseconds: 0 }).getTime() - currentDate.getTime();
    let dateOutput = format(selectedDate, formatDayString);

    if (dateDifference === 0) {
      dateOutput = this.translocoService.translate('date.today');
    } else if (dateDifference === -differenceMeasure) {
      dateOutput = this.translocoService.translate('date.yesterday');
    } else if (dateDifference === differenceMeasure) {
      dateOutput = this.translocoService.translate('date.tomorrow');
    }

    return withTime ? dateOutput + formatSeparator + format(selectedDate, formatTimeString) : dateOutput;
  }
}
