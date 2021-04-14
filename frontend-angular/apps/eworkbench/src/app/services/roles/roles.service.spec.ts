/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { createHttpFactory, mockProvider, SpectatorHttp } from '@ngneat/spectator/jest';
import { RolesService } from './roles.service';

describe('RolesService', () => {
  let spectator: SpectatorHttp<RolesService>;
  const createService = createHttpFactory({
    service: RolesService,
    providers: [mockProvider(RolesService)],
  });

  beforeEach(() => (spectator = createService()));

  it('should be created', () => {
    expect(spectator).toBeTruthy();
  });
});
