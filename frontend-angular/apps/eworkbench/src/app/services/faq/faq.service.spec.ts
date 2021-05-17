/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpParams } from '@angular/common/http';
import { mockFAQList } from '@eworkbench/mocks';
import { createHttpFactory, HttpMethod, mockProvider, SpectatorHttp } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { FAQService } from './faq.service';

describe('FAQService', () => {
  let spectator: SpectatorHttp<FAQService>;
  const createService = createHttpFactory({
    service: FAQService,
    providers: [
      mockProvider(FAQService, {
        get: () => of(mockFAQList),
      }),
    ],
  });

  beforeEach(() => (spectator = createService()));

  it('should be created', () => {
    expect(spectator).toBeTruthy();
  });

  it('should get data with HttpParams', () => {
    const params = new HttpParams().set('test', 'true');
    spectator.service.get(params).subscribe(data => {
      expect(data).toEqual(mockFAQList);
    });
    spectator.expectOne(`${spectator.service.apiUrl}?${params.toString()}`, HttpMethod.GET);
  });

  it('should get data without HttpParams', () => {
    spectator.service.get().subscribe(data => {
      expect(data).toEqual(mockFAQList);
    });
    spectator.expectOne(spectator.service.apiUrl, HttpMethod.GET);
  });
});
