/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { mockLabBookSection, mockLabBookSectionPayload } from '@eworkbench/mocks';
import { createHttpFactory, HttpMethod, mockProvider, SpectatorHttp } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { LabBookSectionsService } from './labbook-sections.service';

const pk = '185cdf73-57d3-442e-b778-7ccba9a54b4e';

describe('LabBookSectionsService', () => {
  let spectator: SpectatorHttp<LabBookSectionsService>;
  const createService = createHttpFactory({
    service: LabBookSectionsService,
    providers: [
      mockProvider(LabBookSectionsService, {
        add: () => of(mockLabBookSection),
        get: () => of(mockLabBookSection),
        patch: () => of(mockLabBookSection),
      }),
    ],
  });

  beforeEach(() => (spectator = createService()));

  it('should be created', () => {
    expect(spectator).toBeTruthy();
  });

  it('should add a new LabBook section', () => {
    spectator.service.add(mockLabBookSectionPayload).subscribe(val => expect(val).toEqual(mockLabBookSection));
    spectator.expectOne(spectator.service.apiUrl, HttpMethod.POST);
  });

  it('should get LabBook section details', () => {
    spectator.service.get(pk).subscribe(data => {
      expect(data).toEqual(mockLabBookSection);
    });
    spectator.expectOne(`${spectator.service.apiUrl}${pk}/`, HttpMethod.GET);
  });

  it('should patch a LabBook section', () => {
    spectator.service.patch(pk, mockLabBookSectionPayload).subscribe(val => expect(val).toEqual(mockLabBookSection));
    spectator.expectOne(`${spectator.service.apiUrl}${pk}/`, HttpMethod.PATCH);
  });
});
