/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { RouterTestingModule } from '@angular/router/testing';
import { getTranslocoModule } from '@app/transloco-testing.module';
import { mockAnonymousUser, mockUser, mockUserWithoutNames } from '@eworkbench/mocks';
import { ModalsModule } from '@eworkbench/modals';
import { DialogService } from '@ngneat/dialog';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { UserModule } from '../../user.module';
import { UserDetailsModalComponent } from '../modals/user-details/user-details.component';
import { UserDetailsComponent } from './user-details.component';

describe('UserDetailsComponent', () => {
  let spectator: Spectator<UserDetailsComponent>;
  const createComponent = createComponentFactory({
    component: UserDetailsComponent,
    declarations: [UserDetailsModalComponent],
    imports: [getTranslocoModule(), ModalsModule, RouterTestingModule, UserModule],
    mocks: [DialogService],
  });

  beforeEach(() => (spectator = createComponent({ props: { user: mockUser } })));

  it('should create', () => {
    expect(spectator).toBeTruthy();
  });

  it('should show anonymized data', () => {
    spectator.setInput({
      user: mockAnonymousUser,
    });
    const ngContent = spectator.query<HTMLDivElement>('div');
    expect(ngContent).toHaveText('Anonymous user');
  });

  it('should show full name of the user', () => {
    spectator.setInput({
      user: mockUser,
    });
    const ngContent = spectator.query<HTMLLinkElement>('a');
    expect(ngContent).toHaveText('User Name');
  });

  it('should show username of the user', () => {
    spectator.setInput({
      user: mockUserWithoutNames,
    });
    const ngContent = spectator.query<HTMLLinkElement>('a');
    expect(ngContent).toHaveText('user');
  });
});
