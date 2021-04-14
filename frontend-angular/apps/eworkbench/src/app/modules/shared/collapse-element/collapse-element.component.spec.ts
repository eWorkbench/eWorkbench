/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { LoadingModule } from '@app/modules/loading/loading.module';
import { IconsModule } from '@eworkbench/icons';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { CollapseModule } from 'ngx-bootstrap/collapse';
import { CollapseElementComponent } from './collapse-element.component';

describe('CollapseElementComponent', () => {
  let spectator: Spectator<CollapseElementComponent>;
  const createComponent = createComponentFactory({
    component: CollapseElementComponent,
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
