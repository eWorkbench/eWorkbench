/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { mockNotificationConfiguration } from '@eworkbench/mocks';
import { createHttpFactory, HttpMethod, mockProvider, SpectatorHttp } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { NotificationConfigurationService } from './notification-configuration.service';

describe('NotificationConfigurationService', () => {
  let spectator: SpectatorHttp<NotificationConfigurationService>;
  const createService = createHttpFactory({
    service: NotificationConfigurationService,
    providers: [
      mockProvider(NotificationConfigurationService, {
        get: () => of(mockNotificationConfiguration),
        put: () => of(mockNotificationConfiguration),
      }),
    ],
  });

  beforeEach(() => (spectator = createService()));

  it('should be created', () => {
    expect(spectator.service).toBeTruthy();
  });

  it('should get notification configuration', () => {
    spectator.service.get().subscribe(val => expect(val).toEqual(mockNotificationConfiguration));
    spectator.expectOne(spectator.service.apiUrl, HttpMethod.GET);
  });

  it('should update notification configuration', () => {
    spectator.service.put(mockNotificationConfiguration).subscribe(val => expect(val).toEqual(mockNotificationConfiguration));
    spectator.expectOne(spectator.service.apiUrl, HttpMethod.PUT);
  });
});
