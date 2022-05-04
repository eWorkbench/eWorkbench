/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PendingChangesGuard } from '@app/guards/pending-changes/pending-changes.guard';
import { DMPPageComponent } from './components/dmp-page/dmp-page.component';
import { DMPsPageComponent } from './components/dmps-page/dmps-page.component';

const routes: Routes = [
  {
    path: '',
    component: DMPsPageComponent,
  },
  {
    path: ':id',
    component: DMPPageComponent,
    canDeactivate: [PendingChangesGuard],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DMPsPageRoutingModule {}
