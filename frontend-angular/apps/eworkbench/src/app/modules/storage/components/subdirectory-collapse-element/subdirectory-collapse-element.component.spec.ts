/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { getTranslocoModule } from '@app/transloco-testing.module';
import { IconsModule } from '@eworkbench/icons';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { CollapseModule } from 'ngx-bootstrap/collapse';
import { SubdirectoryCollapseElementComponent } from './subdirectory-collapse-element.component';

describe('SubdirectoryCollapseElementComponent', () => {
  let spectator: Spectator<SubdirectoryCollapseElementComponent>;
  const createComponent = createComponentFactory({
    component: SubdirectoryCollapseElementComponent,
    imports: [getTranslocoModule(), CollapseModule.forRoot(), IconsModule],
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
