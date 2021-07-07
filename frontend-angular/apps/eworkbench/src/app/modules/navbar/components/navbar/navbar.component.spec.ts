/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { DragDropModule } from '@angular/cdk/drag-drop';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { fakeAsync } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { routes } from '@app/app-routing.module';
import { AppVersionService, AuthService } from '@app/services';
import { getTranslocoModule } from '@app/transloco-testing.module';
import { MatomoModule } from 'ngx-matomo-v9';
import { FormsModule } from '@eworkbench/forms';
import { IconsModule } from '@eworkbench/icons';
import { mockAppVersion, mockUserState } from '@eworkbench/mocks';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import fc from 'fast-check';
import { CollapseModule } from 'ngx-bootstrap/collapse';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { ToastrService } from 'ngx-toastr';
import { of } from 'rxjs';
import { GlobalSearchComponent } from '../global-search/global-search.component';
import { GlobalNotificationsComponent } from '../notifications/global-notifications.component';
import { OrderedMenuComponent } from '../ordered-menu/ordered-menu.component';
import { NavbarComponent } from './navbar.component';
import { ModalsModule } from '@eworkbench/modals';

describe('NavbarComponent', () => {
  let spectator: Spectator<NavbarComponent>;
  const createComponent = createComponentFactory({
    component: NavbarComponent,
    declarations: [OrderedMenuComponent, GlobalSearchComponent, GlobalNotificationsComponent],
    imports: [
      HttpClientTestingModule,
      FormsModule,
      getTranslocoModule(),
      CollapseModule.forRoot(),
      BsDropdownModule.forRoot(),
      RouterTestingModule.withRoutes(routes),
      IconsModule,
      DragDropModule,
      MatomoModule,
      ModalsModule,
    ],
    providers: [
      mockProvider(AuthService, {
        user$: of(mockUserState),
        logout: () => {},
      }),
      mockProvider(AppVersionService, {
        get: () => of(mockAppVersion),
      }),
    ],
    mocks: [ToastrService],
  });

  beforeEach(() => (spectator = createComponent()));

  it('should create', () => {
    expect(spectator).toBeTruthy();
  });

  it('should call onLogout()', fakeAsync(() => {
    spectator.fixture.ngZone?.run(() => {
      const onLogoutSpy = jest.spyOn(spectator.component, 'onLogout');
      spectator.component.onLogout();
      expect(onLogoutSpy).toHaveBeenCalledTimes(1);
    });
  }));

  it('should call getUserName() and return a generic name for the menu entry', () => {
    spectator.setInput({
      currentUser: null,
    });
    expect(spectator.component.getUserName()).toBe('Profile');
  });

  it('should call getUserName() and return the username', () => {
    fc.assert(
      fc.property(fc.string(), string => {
        spectator.setInput({
          currentUser: {
            username: string,
            userprofile: {},
          } as any,
        });
        expect(spectator.component.getUserName()).toBe(string);
      })
    );
  });

  it('should call getUserName() and return undefined', () => {
    fc.assert(
      fc.property(fc.string(), string => {
        spectator.setInput({
          currentUser: {
            userprofile: {
              first_name: string,
            },
          } as any,
        });
        expect(spectator.component.getUserName()).toBeUndefined();
      })
    );
  });

  it('should call getUserName() and return the full name', () => {
    fc.assert(
      fc.property(fc.string(), fc.string(1, 20), fc.string(1, 20), (username, firstName, lastName) => {
        spectator.setInput({
          currentUser: {
            username: username,
            userprofile: {
              first_name: firstName,
              last_name: lastName,
            },
          } as any,
        });
        expect(spectator.component.getUserName()).toBe(`${firstName} ${lastName}`);
      })
    );
  });
});
