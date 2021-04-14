/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { IconComponent } from './icon.component';

describe('IconComponent', () => {
  let spectator: Spectator<IconComponent>;
  const createComponent = createComponentFactory({
    component: IconComponent,
  });

  beforeEach(() => (spectator = createComponent()));

  it('should create', () => {
    expect(spectator).toBeTruthy();
  });

  it('should set a class name', () => {
    const expectedValue = 'my-icon-name';
    spectator.setInput({
      className: expectedValue,
    });
    expect(spectator.component.className).toEqual(expectedValue);
  });
});
