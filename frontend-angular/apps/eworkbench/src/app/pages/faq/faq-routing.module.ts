/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { FAQPageComponent } from './components/faq-page/faq-page.component';

const routes: Routes = [
  {
    path: '',
    component: FAQPageComponent,
  },
  {
    path: ':id',
    component: FAQPageComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class FAQPageRoutingModule {}
