/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { MatomoGuard } from '@app/guards/matomo/matomo.guard';
import { PendingChangesGuard } from '@app/guards/pending-changes/pending-changes.guard';
import { DssContainerPageComponent } from './components/dss-container-page/dss-container-page.component';
import { DssContainersPageComponent } from './components/dss-containers-page/dss-containers-page.component';

const routes: Routes = [
  {
    path: '',
    component: DssContainersPageComponent,
  },
  {
    path: ':id',
    component: DssContainerPageComponent,
    canActivate: [MatomoGuard],
    canDeactivate: [PendingChangesGuard],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DssContainersPageRoutingModule {}
