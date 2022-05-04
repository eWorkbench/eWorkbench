/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { MatomoGuard } from '@app/guards/matomo/matomo.guard';
import { PendingChangesGuard } from '@app/guards/pending-changes/pending-changes.guard';
import { AppointmentPageComponent } from './components/appointment-page/appointment-page.component';
import { AppointmentsPageComponent } from './components/appointments-page/appointments-page.component';

const routes: Routes = [
  {
    path: '',
    component: AppointmentsPageComponent,
  },
  {
    path: ':id',
    component: AppointmentPageComponent,
    canActivate: [MatomoGuard],
    canDeactivate: [PendingChangesGuard],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AppointmentsPageRoutingModule {}
