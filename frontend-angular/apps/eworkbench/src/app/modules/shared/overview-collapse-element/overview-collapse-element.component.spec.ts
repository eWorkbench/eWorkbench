/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { LoadingModule } from '@app/modules/loading/loading.module';
import { IconsModule } from '@eworkbench/icons';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { CollapseModule } from 'ngx-bootstrap/collapse';
import { OverviewCollapseElementComponent } from './overview-collapse-element.component';

describe('OverviewCollapseElementComponent', () => {
  let spectator: Spectator<OverviewCollapseElementComponent>;
  const createComponent = createComponentFactory({
    component: OverviewCollapseElementComponent,
    imports: [LoadingModule, CollapseModule.forRoot(), IconsModule],
  });

  beforeEach(() => (spectator = createComponent()));

  it('should create', () => {
    expect(spectator).toBeTruthy();
  });

  it('should toggle the collapse state', () => {
    expect(spectator.component.collapsed).toBe(false);
    spectator.component.onToggleCollapse();
    expect(spectator.component.collapsed).toBe(true);
    spectator.component.onToggleCollapse();
    expect(spectator.component.collapsed).toBe(false);
  });
});
