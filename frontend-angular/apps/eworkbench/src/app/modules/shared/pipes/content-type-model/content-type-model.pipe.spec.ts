/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ContentTypeModelService } from '@app/services';
import { getTranslocoModule } from '@app/transloco-testing.module';
import { createPipeFactory, mockProvider, SpectatorPipe } from '@ngneat/spectator/jest';
import { FormatContentTypeModelPipe } from './content-type-model.pipe';

describe('FormatContentTypeModelPipe', () => {
  let spectator: SpectatorPipe<FormatContentTypeModelPipe>;
  const createPipe = createPipeFactory({
    pipe: FormatContentTypeModelPipe,
    imports: [getTranslocoModule()],
    providers: [
      mockProvider(ContentTypeModelService, {
        get: (name: string) => {
          if (name === 'shared_elements.contact') {
            return 'Contact';
          } else if (name === 'shared_elements.undefined') {
            return undefined;
          }

          return '';
        },
      }),
    ],
  });

  it('it should properly format a content type model string', () => {
    spectator = createPipe(`{{ 'shared_elements.contact' | formatContentTypeModel }}`);
    expect(spectator.element).toHaveText('Contact');
  });

  it('it should return an empty string', () => {
    spectator = createPipe(`{{ 'shared_elements.undefined' | formatContentTypeModel }}`);
    expect(spectator.element).toHaveText('');
  });

  it('it should return an empty string', () => {
    spectator = createPipe(`{{ '' | formatContentTypeModel }}`);
    expect(spectator.element).toHaveText('');
  });
});
