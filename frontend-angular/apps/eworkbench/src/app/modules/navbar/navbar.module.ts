/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslocoRootModule } from '@app/transloco-root.module';
import { FormsModule } from '@eworkbench/forms';
import { IconsModule } from '@eworkbench/icons';
import { ModalsModule } from '@eworkbench/modals';
import { CollapseModule } from 'ngx-bootstrap/collapse';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { GlobalSearchComponent } from './components/global-search/global-search.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { GlobalNotificationsComponent } from './components/notifications/global-notifications.component';
import { OrderedMenuComponent } from './components/ordered-menu/ordered-menu.component';
import { LoadingModule } from '../loading/loading.module';
import { SharedModule } from '../shared/shared.module';
import { UserModule } from '../user/user.module';

@NgModule({
  declarations: [NavbarComponent, GlobalSearchComponent, OrderedMenuComponent, GlobalNotificationsComponent],
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    TranslocoRootModule,
    CollapseModule.forRoot(),
    BsDropdownModule.forRoot(),
    IconsModule,
    SharedModule,
    UserModule,
    LoadingModule,
    DragDropModule,
    ModalsModule,
  ],
  exports: [NavbarComponent],
})
export class NavbarModule {}
