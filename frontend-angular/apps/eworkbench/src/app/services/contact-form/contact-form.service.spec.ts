/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { mockContactFormPayload } from '@eworkbench/mocks';
import { createHttpFactory, HttpMethod, mockProvider, SpectatorHttp } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { ContactFormService } from './contact-form.service';

describe('ContactFormService', () => {
  let spectator: SpectatorHttp<ContactFormService>;
  const createService = createHttpFactory({
    service: ContactFormService,
    providers: [
      mockProvider(ContactFormService, {
        send: () => of(),
      }),
    ],
  });

  beforeEach(() => (spectator = createService()));

  it('should be created', () => {
    expect(spectator).toBeTruthy();
  });

  it('should send a message', () => {
    spectator.service.send(mockContactFormPayload).subscribe();
    spectator.expectOne(spectator.service.apiUrl, HttpMethod.POST);
  });
});
