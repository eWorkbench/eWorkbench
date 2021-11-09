/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { createHttpFactory, SpectatorHttp } from '@ngneat/spectator/jest';
import { set } from 'date-fns';
import { DateService } from './date.service';

describe('DateService', () => {
  let spectator: SpectatorHttp<DateService>;
  const createService = createHttpFactory({
    service: DateService,
  });

  beforeEach(() => (spectator = createService()));

  it('should be created', () => {
    expect(spectator).toBeTruthy();
  });

  it('should fix a date', () => {
    const dateMidnight = set(new Date(), { year: 2021, month: 1, date: 10, hours: 0, minutes: 0, seconds: 0, milliseconds: 0 });
    const dateIntraday = set(new Date(), { year: 2021, month: 1, date: 10, hours: 1, minutes: 0, seconds: 0, milliseconds: 0 });

    const fixedDateMidnight = new Date(Date.parse(spectator.service.fixFullDay(dateMidnight.toISOString())));
    expect(fixedDateMidnight.getFullYear()).toBe(2021);
    expect(fixedDateMidnight.getMonth()).toBe(1);
    expect(fixedDateMidnight.getDate()).toBe(10);
    expect(fixedDateMidnight.getHours()).toBe(0);
    expect(fixedDateMidnight.getMinutes()).toBe(0);
    expect(fixedDateMidnight.getSeconds()).toBe(0);
    expect(fixedDateMidnight.getMilliseconds()).toBe(0);

    const fixedDateIntraday = new Date(Date.parse(spectator.service.fixFullDay(dateIntraday.toISOString())));
    expect(fixedDateIntraday.getFullYear()).toBe(2021);
    expect(fixedDateIntraday.getMonth()).toBe(1);
    expect(fixedDateIntraday.getDate()).toBe(11);
    expect(fixedDateIntraday.getHours()).toBe(0);
    expect(fixedDateIntraday.getMinutes()).toBe(0);
    expect(fixedDateIntraday.getSeconds()).toBe(0);
    expect(fixedDateIntraday.getMilliseconds()).toBe(0);
  });
});
