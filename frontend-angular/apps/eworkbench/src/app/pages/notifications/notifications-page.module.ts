/* istanbul ignore file */

/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationsPageRoutingModule } from './notifications-page-routing.module';
import { UserModule } from '@app/modules/user/user.module';
import { TranslocoRootModule } from '@app/transloco-root.module';
import { HeaderModule } from '@app/modules/header/header.module';
import { TableModule } from '@eworkbench/table';
import { LoadingModule } from '@app/modules/loading/loading.module';
import { SharedModule } from '@app/modules/shared/shared.module';
import { IconsModule } from '@eworkbench/icons';
import { SkeletonsModule } from '@eworkbench/skeletons';
import { NotificationsPageComponent } from './components/notifications-page/notifications-page.component';
import { NotificationModule } from '@app/modules/notification/notification.module';

@NgModule({
  declarations: [NotificationsPageComponent],
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
