/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { getTranslocoModule } from '@app/transloco-testing.module';
import { mockPrivilegesApi } from '@eworkbench/mocks';
import { createHttpFactory, SpectatorHttp } from '@ngneat/spectator/jest';
import { PrivilegesService } from './privileges.service';

describe('PrivilegesService', () => {
  let spectator: SpectatorHttp<PrivilegesService>;
  const createService = createHttpFactory({
    service: PrivilegesService,
    imports: [getTranslocoModule()],
  });

  beforeEach(() => (spectator = createService()));

  it('should be created', () => {
    expect(spectator).toBeTruthy();
  });

  it('should call transform()', () => {
    const transformSpy = jest.spyOn(spectator.service, 'transform');

    spectator.service.transform(mockPrivilegesApi, false);
    expect(transformSpy).toHaveBeenCalledTimes(1);
    expect(transformSpy).toHaveBeenCalledWith(mockPrivilegesApi, false);

    spectator.service.transform(mockPrivilegesApi, true);
    expect(transformSpy).toHaveBeenCalledTimes(2);
    expect(transformSpy).toHaveBeenCalledWith(mockPrivilegesApi, true);
  });
});
