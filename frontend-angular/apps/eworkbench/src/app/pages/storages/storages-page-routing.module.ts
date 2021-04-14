/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { MatomoGuard } from '@app/guards/matomo/matomo.guard';
import { PendingChangesGuard } from '@app/guards/pending-changes/pending-changes.guard';
import { StoragePageComponent } from './components/storage-page/storage-page.component';
import { StoragesPageComponent } from './components/storages-page/storages-page.component';

const routes: Routes = [
  {
    path: '',
    component: StoragesPageComponent,
  },
  {
    path: ':id',
    component: StoragePageComponent,
    canActivate: [MatomoGuard],
    canDeactivate: [PendingChangesGuard],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class StoragesPageRoutingModule {}
