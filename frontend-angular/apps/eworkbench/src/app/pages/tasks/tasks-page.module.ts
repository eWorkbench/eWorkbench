/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { CommentModule } from '@app/modules/comment/comment.module';
import { DetailsDropdownModule } from '@app/modules/details-dropdown/details-dropdown.module';
import { FavoritesModule } from '@app/modules/favorites/favorites.module';
import { FormHelperModule } from '@app/modules/form-helper/form-helper.module';
import { HeaderModule } from '@app/modules/header/header.module';
import { LabelModule } from '@app/modules/label/label.module';
import { LinkModule } from '@app/modules/link/link.module';
import { LoadingModule } from '@app/modules/loading/loading.module';
import { LockModule } from '@app/modules/lock/lock.module';
import { MetadataModule } from '@app/modules/metadata/metadata.module';
import { ProjectModule } from '@app/modules/project/project.module';
import { RecentChangesModule } from '@app/modules/recent-changes/recent-changes.module';
import { CustomControlErrorComponent } from '@app/modules/shared/control-error/control-error.component';
import { SharedModule } from '@app/modules/shared/shared.module';
import { TaskModule } from '@app/modules/task/task.module';
import { TrashModule } from '@app/modules/trash/trash.module';
import { UserModule } from '@app/modules/user/user.module';
import { VersionsModule } from '@app/modules/versions/versions.module';
import { TranslocoRootModule } from '@app/transloco-root.module';
import { FormsModule } from '@eworkbench/forms';
import { IconsModule } from '@eworkbench/icons';
import { ModalsModule } from '@eworkbench/modals';
import { SkeletonsModule } from '@eworkbench/skeletons';
import { TableModule } from '@eworkbench/table';
import { WysiwygEditorModule } from '@eworkbench/wysiwyg-editor';
import { ErrorTailorModule } from '@ngneat/error-tailor';
import { TranslocoService } from '@ngneat/transloco';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { TaskPageComponent } from './components/task-page/task-page.component';
import { TasksPageComponent } from './components/tasks-page/tasks-page.component';
import { TasksPageRoutingModule } from './tasks-page-routing.module';

@NgModule({
  declarations: [TasksPageComponent, TaskPageComponent],
  imports: [
    CommonModule,
    TasksPageRoutingModule,
    TranslocoRootModule,
    HeaderModule,
    TableModule,
    FormsModule,
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
    TrashModule,
    UserModule,
    LoadingModule,
    LockModule,
    FormHelperModule,
    ModalsModule,
    SharedModule,
    DetailsDropdownModule,
    WysiwygEditorModule,
    RecentChangesModule,
    VersionsModule,
    BsDropdownModule.forRoot(),
    MetadataModule,
    ProjectModule,
    LabelModule,
    IconsModule,
    TaskModule,
    SkeletonsModule,
    LinkModule,
    FavoritesModule,
    CommentModule,
    TooltipModule.forRoot(),
  ],
})
export class TasksPageModule {}
