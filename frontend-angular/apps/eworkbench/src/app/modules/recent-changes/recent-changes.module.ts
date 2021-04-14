/* istanbul ignore file */

/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MetadataModule } from '@app/modules/metadata/metadata.module';
import { SharedModule } from '@app/modules/shared/shared.module';
import { UserModule } from '@app/modules/user/user.module';
import { TranslocoRootModule } from '@app/transloco-root.module';
import { FormsModule } from '@eworkbench/forms';
import { IconsModule } from '@eworkbench/icons';
import { ModalsModule } from '@eworkbench/modals';
import { TableModule } from '@eworkbench/table';
import { DMPModule } from '../dmp/dmp.module';
import { LabelModule } from '../label/label.module';
import { ResourceModule } from '../resource/resource.module';
import { TaskModule } from '../task/task.module';
import { RecentChangesModalComponent } from './components/modals/recent-changes/recent-changes.component';
import { RecentChangesDirectoryStructureComponent } from './components/recent-changes/directory-structure/directory-structure.component';
import { RecentChangesDMPFormDataComponent } from './components/recent-changes/dmp-form-data/dmp-form-data.component';
import { RecentChangesDMPFormComponent } from './components/recent-changes/dmp-form/dmp-form.component';
import { RecentChangesLabelsComponent } from './components/recent-changes/labels/labels.component';
import { RecentChangesProjectsComponent } from './components/recent-changes/projects/projects.component';
import { RecentChangesComponent } from './components/recent-changes/recent-changes.component';
import { RecentChangesResourceAvailabilityUserGroupsComponent } from './components/recent-changes/resource-availability-user-groups/user-groups.component';
import { RecentChangesTaskBoardColumnsComponent } from './components/recent-changes/task-board-columns/task-board-columns.component';
import { RecentChangesTaskChecklistComponent } from './components/recent-changes/task-checklist/task-checklist.component';
import { RecentChangesUsersComponent } from './components/recent-changes/users/users.component';

@NgModule({
  declarations: [
    RecentChangesComponent,
    RecentChangesModalComponent,
    RecentChangesTaskChecklistComponent,
    RecentChangesUsersComponent,
    RecentChangesProjectsComponent,
    RecentChangesResourceAvailabilityUserGroupsComponent,
    RecentChangesTaskBoardColumnsComponent,
    RecentChangesLabelsComponent,
    RecentChangesDirectoryStructureComponent,
    RecentChangesDMPFormComponent,
    RecentChangesDMPFormDataComponent,
  ],
  imports: [
    CommonModule,
    TranslocoRootModule,
    TableModule,
    TranslocoRootModule,
    UserModule,
    SharedModule,
    MetadataModule,
    IconsModule,
    ModalsModule,
    TaskModule,
    LabelModule,
    FormsModule,
    UserModule,
    RouterModule,
    ResourceModule,
    DMPModule,
  ],
  exports: [
    RecentChangesComponent,
    RecentChangesModalComponent,
    RecentChangesTaskChecklistComponent,
    RecentChangesUsersComponent,
    RecentChangesProjectsComponent,
    RecentChangesResourceAvailabilityUserGroupsComponent,
    RecentChangesTaskBoardColumnsComponent,
    RecentChangesLabelsComponent,
    RecentChangesDirectoryStructureComponent,
    RecentChangesDMPFormComponent,
    RecentChangesDMPFormDataComponent,
  ],
})
export class RecentChangesModule {}
