/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { SpectatorRouting, createRoutingFactory } from '@ngneat/spectator/jest';
import { FooterComponent } from './footer.component';
import { getTranslocoModule } from '@app/transloco-testing.module';

describe('FooterComponent', () => {
  let spectator: SpectatorRouting<FooterComponent>;
  const createComponent = createRoutingFactory({
    component: FooterComponent,
    imports: [getTranslocoModule()],
  });

  beforeEach(() => (spectator = createComponent()));

  it('should create', () => {
    expect(spectator).toBeTruthy();
  });

  it('should have the proper brand name', () => {
    const span = spectator.query<HTMLSpanElement>('.navbar-brand');
    expect(span).toHaveText('Universitätsbibliothek der Technischen Universität München');
  });

  it('should match snapshot', () => {
    expect(spectator.fixture).toMatchSnapshot();
  });
});
