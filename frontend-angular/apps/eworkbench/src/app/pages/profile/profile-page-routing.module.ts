/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { MatomoGuard } from '@app/guards/matomo/matomo.guard';
import { PendingChangesGuard } from '@app/guards/pending-changes/pending-changes.guard';
import { PasswordPageComponent } from './components/password-page/password-page.component';
import { ProfilePageComponent } from './components/profile-page/profile-page.component';
import { SettingsPageComponent } from './components/settings-page/settings-page.component';

const routes: Routes = [
  {
    path: '',
    component: ProfilePageComponent,
    canDeactivate: [PendingChangesGuard],
  },
  {
    path: 'password',
    component: PasswordPageComponent,
    canActivate: [MatomoGuard],
  },
  {
    path: 'settings',
    component: SettingsPageComponent,
    canActivate: [MatomoGuard],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ProfilePageRoutingModule {}
