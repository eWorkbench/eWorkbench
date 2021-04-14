/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { createHttpFactory, mockProvider, SpectatorHttp } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { PageTitleService } from './page-title.service';

const mockPageTitle = 'Page';

describe('PageTitleService', () => {
  let spectator: SpectatorHttp<PageTitleService>;
  const createService = createHttpFactory({
    service: PageTitleService,
    providers: [
      mockProvider(PageTitleService, {
        get: () => of(),
      }),
    ],
  });

  beforeEach(() => (spectator = createService()));

  it('should be created', () => {
    expect(spectator).toBeTruthy();
  });

  it('should get the page title and app title via an Observable', () => {
    spectator.service.set(of(mockPageTitle));
    spectator.service.get().subscribe(data => {
      expect(data).toEqual(`${mockPageTitle} • ${spectator.service.appTitle}`);
    });
  });

  it('should get the page title and app title via a string', () => {
    spectator.service.set(mockPageTitle);
    spectator.service.get().subscribe(data => {
      expect(data).toEqual(`${mockPageTitle} • ${spectator.service.appTitle}`);
    });
  });

  it('should get the app title', () => {
    spectator.service.get().subscribe(data => {
      expect(data).toEqual(spectator.service.appTitle);
    });
  });
});
