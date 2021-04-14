/* istanbul ignore file */

/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MatomoGuard } from '@app/guards/matomo/matomo.guard';
import { PendingChangesGuard } from '@app/guards/pending-changes/pending-changes.guard';
import { PluginPageComponent } from './components/plugin-page/plugin-page.component';
import { PluginsPageComponent } from './components/plugins-page/plugins-page.component';

const routes: Routes = [
  {
    path: '',
    component: PluginsPageComponent,
  },
  {
    path: ':id',
    component: PluginPageComponent,
    canActivate: [MatomoGuard],
    canDeactivate: [PendingChangesGuard],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PluginsPageRoutingModule {}
