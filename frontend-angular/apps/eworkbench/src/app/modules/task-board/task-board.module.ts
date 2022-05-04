/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CustomControlErrorComponent } from '@app/modules/shared/control-error/control-error.component';
import { TranslocoRootModule } from '@app/transloco-root.module';
import { FormsModule } from '@eworkbench/forms';
import { IconsModule } from '@eworkbench/icons';
import { ModalsModule } from '@eworkbench/modals';
import { TableModule } from '@eworkbench/table';
import { WysiwygEditorModule } from '@eworkbench/wysiwyg-editor';
import { ErrorTailorModule } from '@ngneat/error-tailor';
import { TranslocoService } from '@ngneat/transloco';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { PopoverModule } from 'ngx-bootstrap/popover';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { BacklogModalComponent } from './components/modals/backlog/backlog.component';
import { ColumnDetailsModalComponent } from './components/modals/column-details/column-details.component';
import { DeleteColumnModalComponent } from './components/modals/delete-column/delete-column.component';
import { NewTaskBoardColumnModalComponent } from './components/modals/new-column/new-column.component';
import { NewTaskBoardModalComponent } from './components/modals/new/new.component';
import { SettingsModalComponent } from './components/modals/settings/settings.component';
import { TaskBoardComponent } from './components/task-board/task-board.component';
import { TaskCardComponent } from './components/task-card/task-card.component';
import { FavoritesModule } from '../favorites/favorites.module';
import { FormHelperModule } from '../form-helper/form-helper.module';
import { LoadingModule } from '../loading/loading.module';
import { RecentChangesModule } from '../recent-changes/recent-changes.module';
import { SharedModule } from '../shared/shared.module';
import { TaskModule } from '../task/task.module';
import { UserModule } from '../user/user.module';

@NgModule({
  declarations: [
    TaskBoardComponent,
    TaskCardComponent,
    BacklogModalComponent,
    ColumnDetailsModalComponent,
    NewTaskBoardModalComponent,
    NewTaskBoardColumnModalComponent,
    DeleteColumnModalComponent,
    SettingsModalComponent,
  ],
  imports: [
    CommonModule,
    SharedModule,
    RouterModule,
    DragDropModule,
    BsDropdownModule.forRoot(),
    ModalsModule,
    TableModule,
    TranslocoRootModule,
    FormsModule,
    FormHelperModule,
    ErrorTailorModule.forRoot({
      errors: {
        useFactory(translocoService: TranslocoService) {
          return {
            required: () => translocoService.translate('form.errors.required'),
          };
        },
        deps: [TranslocoService],
      },
      controlErrorComponent: CustomControlErrorComponent,
    }),
    PopoverModule.forRoot(),
    UserModule,
    TaskModule,
    RecentChangesModule,
    WysiwygEditorModule,
    IconsModule,
    LoadingModule,
    FavoritesModule,
    TooltipModule.forRoot(),
  ],
  exports: [
    TaskBoardComponent,
    BacklogModalComponent,
    NewTaskBoardModalComponent,
    DragDropModule,
    NewTaskBoardColumnModalComponent,
    DeleteColumnModalComponent,
    DragDropModule,
    SettingsModalComponent,
  ],
})
export class TaskBoardModule {}
