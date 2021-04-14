/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ContentTypeModelService } from './content-type-model.service';
import { SpectatorHttp, createHttpFactory } from '@ngneat/spectator/jest';
import { getTranslocoModule } from '@app/transloco-testing.module';

describe('ContentTypeModelService', () => {
  let spectator: SpectatorHttp<ContentTypeModelService>;
  const createService = createHttpFactory({
    service: ContentTypeModelService,
    imports: [getTranslocoModule()],
  });

  beforeEach(() => (spectator = createService()));

  it('should be created', () => {
    expect(spectator).toBeTruthy();
  });

  it('should call get()', () => {
    const getSpy = spyOn(spectator.service, 'get').and.callThrough();
    spectator.service.get('shared_elements.contact', 'translation');
    expect(getSpy).toHaveBeenCalledTimes(1);
    // @ts-expect-error
    spectator.service.get('shared_elements.contact', 'test');
    expect(getSpy).toHaveBeenCalledTimes(2);
    // @ts-expect-error
    spectator.service.get('', 'translation');
    expect(getSpy).toHaveBeenCalledTimes(3);
  });
});
