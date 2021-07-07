/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpParams } from '@angular/common/http';
import { mockContact } from '@eworkbench/mocks';
import { createHttpFactory, HttpMethod, mockProvider, SpectatorHttp } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { SearchService } from './search.service';

describe('SearchService', () => {
  let spectator: SpectatorHttp<SearchService>;
  const createService = createHttpFactory({
    service: SearchService,
    providers: [
      mockProvider(SearchService, {
        contacts: () => of(mockContact),
      }),
    ],
  });

  beforeEach(() => (spectator = createService()));

  it('should be created', () => {
    expect(spectator).toBeTruthy();
  });

  it('should call contacts() without HttpParams', () => {
    const contactsSpy = jest.spyOn(spectator.service, 'contacts');
    spectator.service.contacts('Test').subscribe(contact => expect(contact).toEqual(mockContact));
    expect(contactsSpy).toHaveBeenCalledTimes(1);
    spectator.expectOne(`${spectator.service.apiUrl}?model=contact&search=Test`, HttpMethod.GET);
  });

  it('should call contacts() with HttpParams', () => {
    const params = new HttpParams().set('test', 'true');
    const contactsSpy = jest.spyOn(spectator.service, 'contacts');
    spectator.service.contacts('Test', params).subscribe(contact => expect(contact).toEqual(mockContact));
    expect(contactsSpy).toHaveBeenCalledTimes(1);
    spectator.expectOne(`${spectator.service.apiUrl}?test=true&model=contact&search=Test`, HttpMethod.GET);
  });
});
