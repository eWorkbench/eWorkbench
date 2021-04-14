/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { PluginModule } from '@app/modules/plugin/plugin.module';
import { getTranslocoModule } from '@app/transloco-testing.module';
import { mockPluginDetails } from '@eworkbench/mocks';
import { ModalsModule } from '@eworkbench/modals';
import { DialogRef } from '@ngneat/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { Subject } from 'rxjs';
import { PluginDetailsModalComponent } from './details.component';

describe('PluginDetailsModalComponent', () => {
  let spectator: Spectator<PluginDetailsModalComponent>;
  const createComponent = createComponentFactory({
    component: PluginDetailsModalComponent,
    imports: [getTranslocoModule(), ModalsModule, HttpClientTestingModule, PluginModule],
    providers: [
      mockProvider(DialogRef, {
        close: () => {},
        afterClosed$: new Subject(),
        data: {},
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({ props: { plugin: mockPluginDetails } });
  });

  it('should create', () => {
    expect(spectator).toBeTruthy();
  });
});
