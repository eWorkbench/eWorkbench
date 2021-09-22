/* istanbul ignore file */

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
import { LabBookModule } from '@app/modules/labbook/labbook.module';
import { LinkModule } from '@app/modules/link/link.module';
import { LoadingModule } from '@app/modules/loading/loading.module';
import { LockModule } from '@app/modules/lock/lock.module';
import { ProjectModule } from '@app/modules/project/project.module';
import { CustomControlErrorComponent } from '@app/modules/shared/control-error/control-error.component';
import { SharedModule } from '@app/modules/shared/shared.module';
import { TrashModule } from '@app/modules/trash/trash.module';
import { UserModule } from '@app/modules/user/user.module';
import { TranslocoRootModule } from '@app/transloco-root.module';
import { FormsModule } from '@eworkbench/forms';
import { GanttChartModule } from '@eworkbench/gantt-chart';
import { IconsModule } from '@eworkbench/icons';
import { ModalsModule } from '@eworkbench/modals';
import { SkeletonsModule } from '@eworkbench/skeletons';
import { TableModule } from '@eworkbench/table';
import { WysiwygEditorModule } from '@eworkbench/wysiwyg-editor';
import { ErrorTailorModule } from '@ngneat/error-tailor';
import { TranslocoService } from '@ngneat/transloco';
import { AlertModule } from 'ngx-bootstrap/alert';
import { CollapseModule } from 'ngx-bootstrap/collapse';
import { PopoverModule } from 'ngx-bootstrap/popover';
import { TabsModule } from 'ngx-bootstrap/tabs';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { LeaveProjectModalComponent } from './components/modals/leave/leave.component';
import { NewProjectModalComponent } from './components/modals/new/new.component';
import { StateTimelineModalComponent } from './components/modals/state-timeline/state-timeline.component';
import { ProjectElementComponent } from './components/project-element/project-element.component';
import { ProjectPageComponent } from './components/project-page/project-page.component';
import { ProjectStateTimelineComponent } from './components/project-state-timeline/project-state-timeline.component';
import { ProjectsPageComponent } from './components/projects-page/projects-page.component';
import { ProjectsPageRoutingModule } from './projects-page-routing.module';

@NgModule({
  declarations: [
    ProjectsPageComponent,
    ProjectPageComponent,
    ProjectElementComponent,
    NewProjectModalComponent,
    LeaveProjectModalComponent,
    ProjectStateTimelineComponent,
    StateTimelineModalComponent,
  ],
  imports: [
    CommonModule,
    ProjectsPageRoutingModule,
    TranslocoRootModule,
    HeaderModule,
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
    TableModule,
    SharedModule,
    TrashModule,
    FormHelperModule,
    DetailsDropdownModule,
    LockModule,
    WysiwygEditorModule,
    UserModule,
    CollapseModule.forRoot(),
    LoadingModule,
    ProjectModule,
    AlertModule.forRoot(),
    ModalsModule,
    IconsModule,
    SkeletonsModule,
    LinkModule,
    TooltipModule.forRoot(),
    GanttChartModule,
    TabsModule.forRoot(),
    PopoverModule,
    FavoritesModule,
    LabBookModule,
    CommentModule,
  ],
})
export class ProjectsPageModule {}
