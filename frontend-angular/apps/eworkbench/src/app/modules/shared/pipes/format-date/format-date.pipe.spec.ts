/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { createPipeFactory, SpectatorPipe } from '@ngneat/spectator/jest';
import Chance from 'chance';
import { format, parseISO } from 'date-fns';
import { FormatDatePipe } from './format-date.pipe';

describe('FormatDatePipe', () => {
  let spectator: SpectatorPipe<FormatDatePipe>;
  const date = new Chance().date().toISOString();
  const createPipe = createPipeFactory({
    pipe: FormatDatePipe,
  });

  it('it should properly format a date with the default format', () => {
    spectator = createPipe(`{{ '${date}' | formatDate }}`);
    expect(spectator.element).toHaveText(format(parseISO(date), "yyyy-MM-dd, HH':'mm"));
  });

  it('it should properly format a date with a custom format', () => {
    spectator = createPipe(`{{ '${date}' | formatDate: false }}`);
    expect(spectator.element).toHaveText(format(parseISO(date), 'yyyy-MM-dd'));
  });

  it('it should return an empty string', () => {
    spectator = createPipe(`{{ '' | formatDate }}`);
    expect(spectator.element).toHaveText('');
  });
});
