/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { createPipeFactory, SpectatorPipe } from '@ngneat/spectator/jest';
import { SafeHtmlPipe } from './safe-html.pipe';

describe('SafeHtmlPipe', () => {
  let spectator: SpectatorPipe<SafeHtmlPipe>;
  const createPipe = createPipeFactory({
    pipe: SafeHtmlPipe,
  });

  it('it should trust the HTML', () => {
    spectator = createPipe(`{{ '<p>My text</p>' | safeHTML }}`);
    expect(spectator.element).toHaveText('My text');
  });

  it('it should return an empty string', () => {
    spectator = createPipe(`{{ '' | safeHTML }}`);
    expect(spectator.element).toHaveText('');
  });
});
