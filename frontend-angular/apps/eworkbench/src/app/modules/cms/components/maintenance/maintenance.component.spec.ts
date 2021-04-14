/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { SharedModule } from '@app/modules/shared/shared.module';
import { CMSService } from '@app/stores/cms/services/cms.service';
import { getTranslocoModule } from '@app/transloco-testing.module';
import { IconsModule } from '@eworkbench/icons';
import { mockCMSMaintenance, mockCMSMaintenanceInvisible } from '@eworkbench/mocks';
import { createRoutingFactory, mockProvider, SpectatorRouting } from '@ngneat/spectator/jest';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { of } from 'rxjs';
import { MaintenanceComponent } from './maintenance.component';

describe('MaintenanceComponent', () => {
  let spectator: SpectatorRouting<MaintenanceComponent>;
  const createComponent = createRoutingFactory({
    component: MaintenanceComponent,
    imports: [IconsModule, SharedModule, TooltipModule.forRoot(), getTranslocoModule(), HttpClientTestingModule],
    providers: [
      mockProvider(CMSService, {
        maintenance: () => of(mockCMSMaintenanceInvisible),
        set: () => of(),
      }),
    ],
  });

  beforeEach(() => (spectator = createComponent()));

  it('should create', () => {
    expect(spectator).toBeTruthy();
  });

  it('should hide the maintenance message', () => {
    spectator.setInput({ maintenance: { ...mockCMSMaintenance, visible: true } });
    expect(spectator.component.maintenance.visible).toBe(true);
    Promise.resolve(spectator.component.hideMaintenanceMessage()).then(() => {
      expect(spectator.component.maintenance.visible).toBe(false);
    });
  });
});
