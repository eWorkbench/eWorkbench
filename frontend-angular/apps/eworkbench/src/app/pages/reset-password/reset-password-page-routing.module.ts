/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { MatomoGuard } from '@app/guards/matomo/matomo.guard';
import { ResetPasswordPageComponent } from './components/reset-password-page/reset-password-page.component';

const routes: Routes = [
  {
    path: ':token',
    component: ResetPasswordPageComponent,
    canActivate: [MatomoGuard],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ResetPasswordPageRoutingModule {}
