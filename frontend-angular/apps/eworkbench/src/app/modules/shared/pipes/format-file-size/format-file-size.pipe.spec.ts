/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { createPipeFactory, SpectatorPipe } from '@ngneat/spectator/jest';
import { FormatFileSizePipe } from './format-file-size.pipe';

describe('FormatFileSizePipe', () => {
  let spectator: SpectatorPipe<FormatFileSizePipe>;
  const fileSize = 500;
  const createPipe = createPipeFactory({
    pipe: FormatFileSizePipe,
  });

  it('it should properly format a file size', () => {
    spectator = createPipe(`{{ '${fileSize}' | formatFileSize }}`);
    expect(spectator.element).toHaveText('500 B');
  });
});
