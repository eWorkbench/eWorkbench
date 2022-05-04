/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslocoRootModule } from '@app/transloco-root.module';
import { ModalsModule } from '@eworkbench/modals';
import { TableModule } from '@eworkbench/table';
import { IconsModule } from 'libs/icons/src/lib/icons.module';
import { NotificationsModalComponent } from './components/modals/notifications/notifications.component';
import { NotificationElementComponent } from './components/notification-element/notification-element.component';
import { LoadingModule } from '../loading/loading.module';
import { SharedModule } from '../shared/shared.module';
import { UserModule } from '../user/user.module';

@NgModule({
  declarations: [NotificationElementComponent, NotificationsModalComponent],
  imports: [
    CommonModule,
    LoadingModule,
    SharedModule,
    IconsModule,
    TranslocoRootModule,
    RouterModule,
    ModalsModule,
    UserModule,
    TableModule,
    IconsModule,
  ],
  exports: [NotificationElementComponent, NotificationsModalComponent],
})
export class NotificationModule {}
