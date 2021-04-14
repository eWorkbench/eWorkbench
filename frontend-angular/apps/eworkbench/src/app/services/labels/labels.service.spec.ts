/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { mockLabel, mockLabelPayload } from '@eworkbench/mocks';
import { createHttpFactory, HttpMethod, mockProvider, SpectatorHttp } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { LabelsService } from './labels.service';

describe('TasksService', () => {
  let spectator: SpectatorHttp<LabelsService>;
  const createService = createHttpFactory({
    service: LabelsService,
    providers: [
      mockProvider(LabelsService, {
        add: () => of(mockLabel),
      }),
    ],
  });

  beforeEach(() => (spectator = createService()));

  it('should be created', () => {
    expect(spectator).toBeTruthy();
  });

  it('should get labels', () => {
    spectator.service.get().subscribe(val => expect(val).toEqual([mockLabel, mockLabel]));
    spectator.expectOne(spectator.service.apiUrl, HttpMethod.GET);
  });

  it('should add a new label', () => {
    spectator.service.add(mockLabelPayload).subscribe(val => expect(val).toEqual(mockLabel));
    spectator.expectOne(spectator.service.apiUrl, HttpMethod.POST);
  });
});
