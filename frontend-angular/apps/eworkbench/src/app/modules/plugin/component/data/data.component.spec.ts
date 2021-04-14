/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ModalsModule } from '@eworkbench/modals';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { PluginDataComponent } from './data.component';

describe('PluginDataComponent', () => {
  let spectator: Spectator<PluginDataComponent>;
  const createComponent = createComponentFactory({
    component: PluginDataComponent,
    imports: [ModalsModule],
  });

  beforeEach(() => (spectator = createComponent()));

  it('should create', () => {
    expect(spectator).toBeTruthy();
  });

  it('should call onActivate()', () => {
    spectator.setInput({ active: false });
    expect(spectator.component.active).toBe(false);
    spectator.component.onActivate();
    expect(spectator.component.active).toBe(true);
  });

  it('should call deactivate()', () => {
    spectator.setInput({ active: true });
    expect(spectator.component.active).toBe(true);
    spectator.component.deactivate();
    expect(spectator.component.active).toBe(false);
  });
});
