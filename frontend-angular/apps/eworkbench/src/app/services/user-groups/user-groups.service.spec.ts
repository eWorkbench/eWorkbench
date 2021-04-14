/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { mockUserGroup } from '@eworkbench/mocks';
import { createHttpFactory, HttpMethod, mockProvider, SpectatorHttp } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { UserGroupsService } from './user-groups.service';

describe('UserGroupsService', () => {
  let spectator: SpectatorHttp<UserGroupsService>;
  const createService = createHttpFactory({
    service: UserGroupsService,
    providers: [
      mockProvider(UserGroupsService, {
        get: () => of([mockUserGroup]),
      }),
    ],
  });

  beforeEach(() => (spectator = createService()));

  it('should be created', () => {
    expect(spectator).toBeTruthy();
  });

  it('should get user groups', () => {
    spectator.service.get().subscribe(data => {
      expect(data).toEqual(mockUserGroup);
    });
    spectator.expectOne(spectator.service.apiUrl, HttpMethod.GET);
  });
});
