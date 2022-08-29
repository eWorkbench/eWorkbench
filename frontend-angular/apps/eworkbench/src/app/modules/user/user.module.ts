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
import { NgxHighlightWordsModule } from 'ngx-highlight-words';
import { UserDetailsModalComponent } from './components/modals/user-details/user-details.component';
import { UsersListModalComponent } from './components/modals/users-list/users-list.component';
import { UserAvatarComponent } from './components/user-avatar/user-avatar.component';
import { UserDetailsDropdownComponent } from './components/user-details-dropdown/user-details-dropdown.component';
import { UserDetailsPreviewModalComponent } from './components/user-details-preview/user-details-preview.component';
import { UserDetailsComponent } from './components/user-details/user-details.component';
import { UsersGroupingComponent } from './components/users-grouping/users-grouping.component';
import { SharedModule } from '../shared/shared.module';

@NgModule({
  declarations: [
    UserDetailsComponent,
    UserDetailsDropdownComponent,
    UserDetailsModalComponent,
    UserDetailsPreviewModalComponent,
    UsersGroupingComponent,
    UsersListModalComponent,
    UserAvatarComponent,
  ],
  imports: [
    CommonModule,
    ModalsModule,
    TranslocoRootModule,
    RouterModule,
    IconsModule,
    PopoverModule,
    SharedModule,
    NgxHighlightWordsModule,
  ],
  exports: [
    UserDetailsComponent,
    UserDetailsDropdownComponent,
    UserDetailsModalComponent,
    UserDetailsPreviewModalComponent,
    UsersGroupingComponent,
    UsersListModalComponent,
    UserAvatarComponent,
  ],
})
export class UserModule {}
