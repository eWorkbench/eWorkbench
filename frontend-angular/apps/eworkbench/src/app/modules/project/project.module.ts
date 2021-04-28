/* istanbul ignore file */

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
import { ErrorTailorModule } from '@ngneat/error-tailor';
import { TranslocoService } from '@ngneat/transloco';
import { AlertModule } from 'ngx-bootstrap/alert';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { FormHelperModule } from '../form-helper/form-helper.module';
import { LoadingModule } from '../loading/loading.module';
import { SharedModule } from '../shared/shared.module';
import { UserModule } from '../user/user.module';
import { ProjectLinksComponent } from './components/project-links/project-links.component';
import { ProjectMembersHierarchyComponent } from './components/project-members-hierarchy/project-members-hierarchy.component';
import { ChangeProjectMemberRoleModalComponent } from './components/project-members/modals/change-role/change-role.component';
import { ExternalUserModalComponent } from './components/project-members/modals/external-user/external-user.component';
import { NewProjectMemberModalComponent } from './components/project-members/modals/new/new.component';
import { RemoveProjectMemberModalComponent } from './components/project-members/modals/remove/remove.component';
import { ProjectMembersComponent } from './components/project-members/project-members.component';
import { ProjectSidebarComponent } from './components/project-sidebar/project-sidebar.component';
import { ProjectStateComponent } from './components/project-state/project-state.component';
import { ProjectProgressBarComponent } from './components/project-progress-bar/project-progress-bar.component';
import { PopoverModule } from 'ngx-bootstrap/popover';

@NgModule({
  declarations: [
    ProjectSidebarComponent,
    ProjectMembersComponent,
    NewProjectMemberModalComponent,
    RemoveProjectMemberModalComponent,
    ExternalUserModalComponent,
    ProjectLinksComponent,
    ProjectStateComponent,
    ChangeProjectMemberRoleModalComponent,
    ProjectMembersHierarchyComponent,
    ProjectProgressBarComponent,
  ],
  imports: [
    CommonModule,
    RouterModule,
    ModalsModule,
    FormsModule,
    TranslocoRootModule,
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
    UserModule,
    FormHelperModule,
    TableModule,
    TooltipModule.forRoot(),
    DragDropModule,
    LoadingModule,
    SharedModule,
    AlertModule.forRoot(),
    IconsModule,
    PopoverModule,
  ],
  exports: [
    ProjectSidebarComponent,
    ProjectMembersComponent,
    NewProjectMemberModalComponent,
    RemoveProjectMemberModalComponent,
    ExternalUserModalComponent,
    ProjectLinksComponent,
    ProjectStateComponent,
    ChangeProjectMemberRoleModalComponent,
    ProjectMembersHierarchyComponent,
    ProjectProgressBarComponent,
  ],
})
export class ProjectModule {}
