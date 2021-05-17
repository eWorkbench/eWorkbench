/* istanbul ignore file */

/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslocoRootModule } from '@app/transloco-root.module';
import { FormsModule } from '@eworkbench/forms';
import { IconsModule } from '@eworkbench/icons';
import { ModalsModule } from '@eworkbench/modals';
import { TableModule } from '@eworkbench/table';
import { AlertModule } from 'ngx-bootstrap/alert';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { LoadingModule } from '../loading/loading.module';
import { DeleteModalComponent } from './components/modals/delete/delete.component';
import { TrashNoticeComponent } from './components/notice/notice.component';
import { RestoreButtonComponent } from './components/restore-button/restore-button.component';
import { TrashButtonComponent } from './components/trash-button/trash-button.component';

@NgModule({
  declarations: [TrashButtonComponent, RestoreButtonComponent, DeleteModalComponent, TrashNoticeComponent],
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ModalsModule,
    TableModule,
    TranslocoRootModule,
    LoadingModule,
    AlertModule.forRoot(),
    IconsModule,
    TooltipModule.forRoot(),
  ],
  exports: [TrashButtonComponent, RestoreButtonComponent, DeleteModalComponent, TrashNoticeComponent],
})
/* istanbul ignore next */
export class TrashModule {}
