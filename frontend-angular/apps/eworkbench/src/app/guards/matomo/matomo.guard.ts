/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Injectable, isDevMode } from '@angular/core';
import type { ActivatedRouteSnapshot, CanActivate, RouterStateSnapshot } from '@angular/router';
import { environment } from '@environments/environment';
import { MatomoTracker } from 'ngx-matomo-v9';

@Injectable({
  providedIn: 'root',
})
export class MatomoGuard implements CanActivate {
  public constructor(private readonly matomoTracker: MatomoTracker) {}

  public canActivate(_: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    if (!isDevMode() && environment.tracking) {
      this.matomoTracker.deleteCookies();
      this.matomoTracker.disableCookies();
      this.matomoTracker.setReferrerUrl(location.href);
      this.matomoTracker.setCustomUrl(state.url);
      this.matomoTracker.setDocumentTitle(`${document.domain}/${document.title}`);

      this.matomoTracker.deleteCustomVariables('page');

      const content = document.querySelector('.content');
      if (content) {
        this.matomoTracker.trackContentImpressionsWithinNode(content);
      }

      this.matomoTracker.enableLinkTracking(true);
    }

    return true;
  }
}
