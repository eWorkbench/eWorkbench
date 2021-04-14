/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { createPipeFactory, SpectatorPipe } from '@ngneat/spectator/jest';
import { StripHTMLPipe } from './strip-html.pipe';

describe('StripHTMLPipe', () => {
  let spectator: SpectatorPipe<StripHTMLPipe>;
  const createPipe = createPipeFactory({
    pipe: StripHTMLPipe,
  });

  it('it should strip the HTML parts from the text', () => {
    spectator = createPipe(`{{ '<p>My text is <strong>bold</strong></p>' | stripHTML }}`);
    expect(spectator.element).toHaveText('My text is bold');
  });

  it('it should return an empty string', () => {
    spectator = createPipe(`{{ '' | stripHTML }}`);
    expect(spectator.element).toHaveText('');
  });
});
