/* istanbul ignore file */

/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { NotificationPageComponent } from './components/notification-page/notification-page.component';
import { NotificationsPageComponent } from './components/notifications-page/notifications-page.component';

const routes: Routes = [
  {
    path: '',
    component: NotificationsPageComponent,
  },
  {
    path: ':id',
    component: NotificationPageComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class NotificationsPageRoutingModule {}
