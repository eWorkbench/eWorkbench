/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { AuthService } from '@app/services';
import { getTranslocoModule } from '@app/transloco-testing.module';
import { mockUser } from '@eworkbench/mocks';
import { mockProvider } from '@ngneat/spectator';
import { createRoutingFactory, SpectatorRouting } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { FooterComponent } from './footer.component';

describe('FooterComponent', () => {
  let spectator: SpectatorRouting<FooterComponent>;
  const createComponent = createRoutingFactory({
    component: FooterComponent,
    imports: [getTranslocoModule()],
    providers: [
      mockProvider(AuthService, {
        user$: of(mockUser),
        login: () => of(mockUser),
      }),
    ],
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
