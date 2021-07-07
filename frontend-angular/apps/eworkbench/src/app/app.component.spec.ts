/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Location } from '@angular/common';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { fakeAsync } from '@angular/core/testing';
import { PreloadAllModules, Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { MatomoModule } from 'ngx-matomo-v9';
import { routes } from './app-routing.module';
import { AppComponent } from './app.component';
import { FooterModule } from './modules/footer/footer.module';
import { NavbarModule } from './modules/navbar/navbar.module';
import { getTranslocoModule } from './transloco-testing.module';

describe('AppComponent', () => {
  let spectator: Spectator<AppComponent>;
  const createComponent = createComponentFactory({
    component: AppComponent,
    imports: [
      MatomoModule,
      RouterTestingModule.withRoutes(routes, {
        preloadingStrategy: PreloadAllModules,
        onSameUrlNavigation: 'reload',
      }),
      HttpClientTestingModule,
      getTranslocoModule(),
      NavbarModule,
      FooterModule,
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
  });

  beforeEach(() => (spectator = createComponent()));

  beforeEach(() =>
    spectator.fixture.ngZone?.run(() => {
      spectator.inject(Router).initialNavigation();
    })
  );

  it('should create the app', () => {
    expect(spectator).toBeTruthy();
  });

  it('should navigate to "/"', fakeAsync(() => {
    spectator.component;
    spectator.fixture.ngZone?.run(() => {
      spectator.inject(Router).navigate(['/']);
      spectator.tick();
      expect(spectator.inject(Location).path()).toBe('/login?returnUrl=%2F');
    });
  }));

  /* it('should navigate to "/projects"', fakeAsync(() => {
    spectator.fixture.ngZone?.run(() => {
      spectator.inject(Router).navigate(['/projects']);
      spectator.tick();
      expect(spectator.inject(Location).path()).toBe('/login?returnUrl=%2Fprojects');
    });
  }));

  it('should navigate to "/tasks"', fakeAsync(() => {
    spectator.fixture.ngZone?.run(() => {
      spectator.inject(Router).navigate(['/tasks']);
      spectator.tick();
      expect(spectator.inject(Location).path()).toBe('/login?returnUrl=%2Ftasks');
    });
  }));

  it('should navigate to "/taskboards"', fakeAsync(() => {
    spectator.fixture.ngZone?.run(() => {
      spectator.inject(Router).navigate(['/taskboards']);
      spectator.tick();
      expect(spectator.inject(Location).path()).toBe('/login?returnUrl=%2Ftaskboards');
    });
  }));

  it('should navigate to "/labbooks"', fakeAsync(() => {
    spectator.fixture.ngZone?.run(() => {
      spectator.inject(Router).navigate(['/labbooks']);
      spectator.tick();
      expect(spectator.inject(Location).path()).toBe('/login?returnUrl=%2Flabbooks');
    });
  }));

  it('should navigate to "/projects"', fakeAsync(() => {
    spectator.fixture.ngZone?.run(() => {
      spectator.inject(Router).navigate(['/projects']);
      spectator.tick();
      expect(spectator.inject(Location).path()).toBe('/login?returnUrl=%2Fprojects');
    });
  }));

  it('should navigate to "/calendar"', fakeAsync(() => {
    spectator.fixture.ngZone?.run(() => {
      spectator.inject(Router).navigate(['/calendar']);
      spectator.tick();
      expect(spectator.inject(Location).path()).toBe('/login?returnUrl=%2Fcalendar');
    });
  }));

  it('should navigate to "/main-calendar"', fakeAsync(() => {
    spectator.fixture.ngZone?.run(() => {
      spectator.inject(Router).navigate(['/main-calendar']);
      spectator.tick();
      expect(spectator.inject(Location).path()).toBe('/login?returnUrl=%2Fcalendar');
    });
  }));

  it('should navigate to "/files"', fakeAsync(() => {
    spectator.fixture.ngZone?.run(() => {
      spectator.inject(Router).navigate(['/files']);
      spectator.tick();
      expect(spectator.inject(Location).path()).toBe('/login?returnUrl=%2Ffiles');
    });
  }));

  it('should navigate to "/pictures"', fakeAsync(() => {
    spectator.fixture.ngZone?.run(() => {
      spectator.inject(Router).navigate(['/pictures']);
      spectator.tick();
      expect(spectator.inject(Location).path()).toBe('/login?returnUrl=%2Fpictures');
    });
  }));

  it('should navigate to "/appointments"', fakeAsync(() => {
    spectator.fixture.ngZone?.run(() => {
      spectator.inject(Router).navigate(['/appointments']);
      spectator.tick();
      expect(spectator.inject(Location).path()).toBe('/login?returnUrl=%2Fappointments');
    });
  }));

  it('should navigate to "/meetings"', fakeAsync(() => {
    spectator.fixture.ngZone?.run(() => {
      spectator.inject(Router).navigate(['/meetings']);
      spectator.tick();
      expect(spectator.inject(Location).path()).toBe('/login?returnUrl=%2Fappointments');
    });
  }));

  it('should navigate to "/contacts"', fakeAsync(() => {
    spectator.fixture.ngZone?.run(() => {
      spectator.inject(Router).navigate(['/contacts']);
      spectator.tick();
      expect(spectator.inject(Location).path()).toBe('/login?returnUrl=%2Fcontacts');
    });
  }));

  it('should navigate to "/comments"', fakeAsync(() => {
    spectator.fixture.ngZone?.run(() => {
      spectator.inject(Router).navigate(['/comments']);
      spectator.tick();
      expect(spectator.inject(Location).path()).toBe('/login?returnUrl=%2Fcomments');
    });
  }));

  it('should navigate to "/resources"', fakeAsync(() => {
    spectator.fixture.ngZone?.run(() => {
      spectator.inject(Router).navigate(['/resources']);
      spectator.tick();
      expect(spectator.inject(Location).path()).toBe('/login?returnUrl=%2Fresources');
    });
  }));

  it('should navigate to "/plugin-data"', fakeAsync(() => {
    spectator.fixture.ngZone?.run(() => {
      spectator.inject(Router).navigate(['/plugin-data']);
      spectator.tick();
      expect(spectator.inject(Location).path()).toBe('/login?returnUrl=%2Fplugin-data');
    });
  }));

  it('should navigate to "/dmps"', fakeAsync(() => {
    spectator.fixture.ngZone?.run(() => {
      spectator.inject(Router).navigate(['/dmps']);
      spectator.tick();
      expect(spectator.inject(Location).path()).toBe('/login?returnUrl=%2Fdmps');
    });
  }));

  it('should navigate to "/study-room-booking"', fakeAsync(() => {
    spectator.fixture.ngZone?.run(() => {
      spectator.inject(Router).navigate(['/study-room-booking']);
      spectator.tick();
      expect(spectator.inject(Location).path()).toBe('/login?returnUrl=%2Fstudy-room-booking');
    });
  }));

  it('should navigate to "/metadata-search"', fakeAsync(() => {
    spectator.fixture.ngZone?.run(() => {
      spectator.inject(Router).navigate(['/metadata-search']);
      spectator.tick();
      expect(spectator.inject(Location).path()).toEqual('/login?returnUrl=%2Fmetadata-search');
    });
  }));

  it('should navigate to "/forgot-password"', fakeAsync(() => {
    spectator.fixture.ngZone?.run(() => {
      spectator.inject(Router).navigate(['/forgot-password']);
      spectator.tick();
      expect(spectator.inject(Location).path()).toBe('/forgot-password');
    });
  }));

  it('should navigate to "/reset-password"', fakeAsync(() => {
    spectator.fixture.ngZone?.run(() => {
      spectator.inject(Router).navigate(['/reset-password/912ec803b2ce49e4a541068d495ab570']);
      spectator.tick();
      expect(spectator.inject(Location).path()).toBe('/reset-password/912ec803b2ce49e4a541068d495ab570');
    });
  }));

  it('should navigate to "/profile"', fakeAsync(() => {
    spectator.fixture.ngZone?.run(() => {
      spectator.inject(Router).navigate(['/profile']);
      spectator.tick();
      expect(spectator.inject(Location).path()).toBe('/login?returnUrl=%2Fprofile');
    });
  }));

  it('should navigate to "/contact"', fakeAsync(() => {
    spectator.fixture.ngZone?.run(() => {
      spectator.inject(Router).navigate(['/contact']);
      spectator.tick();
      expect(spectator.inject(Location).path()).toBe('/login?returnUrl=%2Fcontact');
    });
  }));

  it('should navigate to "/faq"', fakeAsync(() => {
    spectator.fixture.ngZone?.run(() => {
      spectator.inject(Router).navigate(['/faq']);
      spectator.tick();
      expect(spectator.inject(Location).path()).toBe('/faq');
    });
  }));

  it('should navigate to "/privacy-policy"', fakeAsync(() => {
    spectator.fixture.ngZone?.run(() => {
      spectator.inject(Router).navigate(['/privacy-policy']);
      spectator.tick();
      expect(spectator.inject(Location).path()).toBe('/privacy-policy');
    });
  }));

  it('should navigate to "/accessibility"', fakeAsync(() => {
    spectator.fixture.ngZone?.run(() => {
      spectator.inject(Router).navigate(['/accessibility']);
      spectator.tick();
      expect(spectator.inject(Location).path()).toBe('/accessibility');
    });
  }));

  it('should navigate to "/imprint"', fakeAsync(() => {
    spectator.fixture.ngZone?.run(() => {
      spectator.inject(Router).navigate(['/imprint']);
      spectator.tick();
      expect(spectator.inject(Location).path()).toBe('/imprint');
    });
  }));

  it('should navigate to "/licenses"', fakeAsync(() => {
    spectator.fixture.ngZone?.run(() => {
      spectator.inject(Router).navigate(['/licenses']);
      spectator.tick();
      expect(spectator.inject(Location).path()).toBe('/licenses');
    });
  })); */
});
