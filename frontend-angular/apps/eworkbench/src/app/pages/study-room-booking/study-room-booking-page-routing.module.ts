/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { StudyRoomBookingPageComponent } from './components/study-room-booking-page/study-room-booking-page.component';

const routes: Routes = [
  {
    path: '',
    component: StudyRoomBookingPageComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class StudyRoomBookingPageRoutingModule {}
