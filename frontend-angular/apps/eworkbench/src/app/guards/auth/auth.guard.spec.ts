/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { NgZone } from '@angular/core';
import { fakeAsync } from '@angular/core/testing';
import { ActivatedRouteSnapshot, PreloadAllModules, RouterStateSnapshot } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { routes } from '@app/app-routing.module';
import { AuthService } from '@app/services';
import { UserService } from '@app/stores/user';
import { mockUserState } from '@eworkbench/mocks';
import { createHttpFactory, mockProvider, SpectatorService } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { AuthGuard } from './auth.guard';

describe('AuthGuard', () => {
  let spectator: SpectatorService<AuthGuard>;
  const createService = createHttpFactory({
    service: AuthGuard,
    imports: [
      RouterTestingModule.withRoutes(routes, {
        preloadingStrategy: PreloadAllModules,
        onSameUrlNavigation: 'reload',
      }),
    ],
    providers: [
      mockProvider(AuthService, {
        user$: of(mockUserState),
      }),
      mockProvider(UserService, {
        get$: of(mockUserState),
        check: () => of(mockUserState),
      }),
    ],
  });
  let zone: NgZone;

  beforeEach(() => {
    spectator = createService();
    localStorage.clear();
    zone = new NgZone({});
  });

  it('should be created', () => {
    expect(spectator).toBeTruthy();
  });

  it('should be logged in and redirect test', fakeAsync(() => {
    zone.run(() => {
      spectator.service.canActivate(new ActivatedRouteSnapshot(), { url: 'test' } as RouterStateSnapshot).subscribe(val => {
        expect(val).toBe(true);
      });
    });
  }));

  it('should not be logged in and redirect to test', fakeAsync(() => {
    localStorage.setItem('token', 'test');
    zone.run(() => {
      spectator.service.canActivate(new ActivatedRouteSnapshot(), { url: 'test' } as RouterStateSnapshot).subscribe(val => {
        expect(val).toBe(true);
      });
    });
  }));
});
