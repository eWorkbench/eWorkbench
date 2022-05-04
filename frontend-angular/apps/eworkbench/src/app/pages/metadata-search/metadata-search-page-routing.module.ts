/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { MetadataSearchPageComponent } from './components/metadata-search-page/metadata-search-page.component';

const routes: Routes = [
  {
    path: '',
    component: MetadataSearchPageComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MetadataSearchPageRoutingModule {}
