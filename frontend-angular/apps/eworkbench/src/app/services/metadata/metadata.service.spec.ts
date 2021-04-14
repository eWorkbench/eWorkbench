/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { mockMetadataField, mockMetadataSearchPayload, mockMetadataSearchResults } from '@eworkbench/mocks';
import { createHttpFactory, HttpMethod, mockProvider, SpectatorHttp } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { MetadataService } from './metadata.service';

describe('MetadataService', () => {
  let spectator: SpectatorHttp<MetadataService>;
  const createService = createHttpFactory({
    service: MetadataService,
    providers: [
      mockProvider(MetadataService, {
        getFields: () => of([mockMetadataField]),
        search: () => of(mockMetadataSearchResults),
      }),
    ],
  });

  beforeEach(() => (spectator = createService()));

  it('should be created', () => {
    expect(spectator).toBeTruthy();
  });

  it('should get metadata fields', () => {
    spectator.service.getFields().subscribe(data => {
      expect(data).toEqual([mockMetadataField]);
    });
    spectator.expectOne(spectator.service.apiUrlFields, HttpMethod.GET);
  });

  it('should search elements with metadata fields', () => {
    spectator.service.search(mockMetadataSearchPayload).subscribe(data => {
      expect(data).toEqual(mockMetadataSearchResults);
    });
    spectator.expectOne(spectator.service.apiUrlSearch, HttpMethod.POST);
  });
});
