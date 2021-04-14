/* istanbul ignore file */

/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { DetailsDropdownModule } from '@app/modules/details-dropdown/details-dropdown.module';
import { FormHelperModule } from '@app/modules/form-helper/form-helper.module';
import { HeaderModule } from '@app/modules/header/header.module';
import { LinkModule } from '@app/modules/link/link.module';
import { LockModule } from '@app/modules/lock/lock.module';
import { ProjectModule } from '@app/modules/project/project.module';
import { RecentChangesModule } from '@app/modules/recent-changes/recent-changes.module';
import { SharedModule } from '@app/modules/shared/shared.module';
import { TaskBoardModule } from '@app/modules/task-board/task-board.module';
import { TrashModule } from '@app/modules/trash/trash.module';
import { UserModule } from '@app/modules/user/user.module';
import { TranslocoRootModule } from '@app/transloco-root.module';
import { FormsModule } from '@eworkbench/forms';
import { IconsModule } from '@eworkbench/icons';
import { SkeletonsModule } from '@eworkbench/skeletons';
import { TableModule } from '@eworkbench/table';
import { TaskBoardPageComponent } from './components/task-board-page/task-board-page.component';
import { TaskBoardsPageComponent } from './components/task-boards-page/task-boards-page.component';
import { TaskBoardsPageRoutingModule } from './task-boards-page-routing.module';

@NgModule({
  declarations: [TaskBoardsPageComponent, TaskBoardPageComponent],
  imports: [
    CommonModule,
    TaskBoardsPageRoutingModule,
    TranslocoRootModule,
    HeaderModule,
    TableModule,
    FormsModule,
    TaskBoardModule,
    TrashModule,
    SharedModule,
    UserModule,
    DetailsDropdownModule,
    ProjectModule,
    IconsModule,
    SkeletonsModule,
    FormHelperModule,
    RecentChangesModule,
    LinkModule,
    LockModule,
  ],
})
export class TaskBoardsPageModule {}