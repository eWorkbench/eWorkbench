/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { getTranslocoModule } from '@app/transloco-testing.module';
import { createHttpFactory, SpectatorHttp } from '@ngneat/spectator/jest';
import { ProjectsSidebarModelService } from './projects-sidebar-model.service';

describe('ProjectsSidebarModelService', () => {
  let spectator: SpectatorHttp<ProjectsSidebarModelService>;
  const createService = createHttpFactory({
    service: ProjectsSidebarModelService,
    imports: [getTranslocoModule()],
  });

  beforeEach(() => (spectator = createService()));

  it('should be created', () => {
    expect(spectator).toBeTruthy();
  });

  it('should call get()', () => {
    const getSpy = spyOn(spectator.service, 'get').and.callThrough();
    spectator.service.get('sidebar.overview');
    expect(getSpy).toHaveBeenCalledTimes(1);
    spectator.service.get('sidebar.overview');
    expect(getSpy).toHaveBeenCalledTimes(2);
    // @ts-expect-error
    spectator.service.get('');
    expect(getSpy).toHaveBeenCalledTimes(3);
  });
});
