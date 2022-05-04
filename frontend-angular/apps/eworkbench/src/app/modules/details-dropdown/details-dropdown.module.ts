/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { UserModule } from '@app/modules/user/user.module';
import { TranslocoRootModule } from '@app/transloco-root.module';
import { FormsModule } from '@eworkbench/forms';
import { IconsModule } from '@eworkbench/icons';
import { ModalsModule } from '@eworkbench/modals';
import { TableModule } from '@eworkbench/table';
import { CollapseModule } from 'ngx-bootstrap/collapse';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { DetailsDropdownComponent } from './components/details-dropdown/details-dropdown.component';
import { DuplicateDMPModalComponent } from './components/modals/duplicate-dmp/duplicate.component';
import { DuplicateProjectModalComponent } from './components/modals/duplicate-project/duplicate.component';
import { PrivilegesModalComponent } from './components/modals/privileges/privileges.component';
import { ShareModalComponent } from './components/modals/share/share.component';
import { LoadingModule } from '../loading/loading.module';

@NgModule({
  declarations: [
    DetailsDropdownComponent,
    PrivilegesModalComponent,
    ShareModalComponent,
    DuplicateProjectModalComponent,
    DuplicateDMPModalComponent,
  ],
  imports: [
    CommonModule,
    RouterModule,
    ModalsModule,
    TableModule,
    TranslocoRootModule,
    CollapseModule.forRoot(),
    BsDropdownModule.forRoot(),
    UserModule,
    FormsModule,
    LoadingModule,
    TooltipModule.forRoot(),
    IconsModule,
  ],
  exports: [
    DetailsDropdownComponent,
    PrivilegesModalComponent,
    ShareModalComponent,
    DuplicateProjectModalComponent,
    DuplicateDMPModalComponent,
  ],
})
export class DetailsDropdownModule {}
