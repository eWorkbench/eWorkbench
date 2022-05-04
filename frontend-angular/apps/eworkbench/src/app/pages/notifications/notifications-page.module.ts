/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { HeaderModule } from '@app/modules/header/header.module';
import { LoadingModule } from '@app/modules/loading/loading.module';
import { NotificationModule } from '@app/modules/notification/notification.module';
import { SharedModule } from '@app/modules/shared/shared.module';
import { UserModule } from '@app/modules/user/user.module';
import { TranslocoRootModule } from '@app/transloco-root.module';
import { IconsModule } from '@eworkbench/icons';
import { SkeletonsModule } from '@eworkbench/skeletons';
import { TableModule } from '@eworkbench/table';
import { NotificationPageComponent } from './components/notification-page/notification-page.component';
import { NotificationsPageComponent } from './components/notifications-page/notifications-page.component';
import { NotificationsPageRoutingModule } from './notifications-page-routing.module';

@NgModule({
  declarations: [NotificationsPageComponent, NotificationPageComponent],
  imports: [
    CommonModule,
    NotificationsPageRoutingModule,
    TranslocoRootModule,
    HeaderModule,
    TableModule,
    UserModule,
    LoadingModule,
    SharedModule,
    IconsModule,
    SkeletonsModule,
    NotificationModule,
  ],
})
export class NotificationsPageModule {}
