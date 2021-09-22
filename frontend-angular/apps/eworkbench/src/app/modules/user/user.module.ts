/* istanbul ignore file */

/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslocoRootModule } from '@app/transloco-root.module';
import { IconsModule } from '@eworkbench/icons';
import { ModalsModule } from '@eworkbench/modals';
import { PopoverModule } from 'ngx-bootstrap/popover';
import { SharedModule } from '../shared/shared.module';
import { UserDetailsModalComponent } from './components/modals/user-details/user-details.component';
import { UsersListModalComponent } from './components/modals/users-list/users-list.component';
import { UserAvatarComponent } from './components/user-avatar/user-avatar.component';
import { UserDetailsPreviewModalComponent } from './components/user-details-preview/user-details-preview.component';
import { UserDetailsComponent } from './components/user-details/user-details.component';
import { UsersGroupingComponent } from './components/users-grouping/users-grouping.component';

@NgModule({
  declarations: [
    UserDetailsComponent,
    UserDetailsModalComponent,
    UserDetailsPreviewModalComponent,
    UsersGroupingComponent,
    UsersListModalComponent,
    UserAvatarComponent,
  ],
  imports: [CommonModule, ModalsModule, TranslocoRootModule, RouterModule, IconsModule, PopoverModule, SharedModule],
  exports: [
    UserDetailsComponent,
    UserDetailsModalComponent,
    UserDetailsPreviewModalComponent,
    UsersGroupingComponent,
    UsersListModalComponent,
    UserAvatarComponent,
  ],
})
/* istanbul ignore next */
export class UserModule {}
