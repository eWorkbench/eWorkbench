/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ClipboardModule } from '@angular/cdk/clipboard';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { CommentModule } from '@app/modules/comment/comment.module';
import { DetailsDropdownModule } from '@app/modules/details-dropdown/details-dropdown.module';
import { FavoritesModule } from '@app/modules/favorites/favorites.module';
import { FormHelperModule } from '@app/modules/form-helper/form-helper.module';
import { HeaderModule } from '@app/modules/header/header.module';
import { LinkModule } from '@app/modules/link/link.module';
import { LoadingModule } from '@app/modules/loading/loading.module';
import { LockModule } from '@app/modules/lock/lock.module';
import { MetadataModule } from '@app/modules/metadata/metadata.module';
import { ProjectModule } from '@app/modules/project/project.module';
import { RecentChangesModule } from '@app/modules/recent-changes/recent-changes.module';
import { SharedModule } from '@app/modules/shared/shared.module';
import { StorageModule } from '@app/modules/storage/storage.module';
import { TrashModule } from '@app/modules/trash/trash.module';
import { UserModule } from '@app/modules/user/user.module';
import { TranslocoRootModule } from '@app/transloco-root.module';
import { FormsModule } from '@eworkbench/forms';
import { IconsModule } from '@eworkbench/icons';
import { ModalsModule } from '@eworkbench/modals';
import { SkeletonsModule } from '@eworkbench/skeletons';
import { TableModule } from '@eworkbench/table';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { NewStorageModalComponent } from './components/modals/new/new.component';
import { StoragePageComponent } from './components/storage-page/storage-page.component';
import { StoragesPageComponent } from './components/storages-page/storages-page.component';
import { StoragesPageRoutingModule } from './storages-page-routing.module';

@NgModule({
  declarations: [StoragesPageComponent, StoragePageComponent, NewStorageModalComponent],
  imports: [
    CommonModule,
    StoragesPageRoutingModule,
    StorageModule,
    TranslocoRootModule,
    HeaderModule,
    FormsModule,
    FormHelperModule,
    UserModule,
    SharedModule,
    IconsModule,
    ModalsModule,
    TooltipModule.forRoot(),
    TableModule,
    TrashModule,
    DetailsDropdownModule,
    SkeletonsModule,
    LockModule,
    MetadataModule,
    RecentChangesModule,
    LinkModule,
    ClipboardModule,
    ProjectModule,
    FavoritesModule,
    CommentModule,
    LoadingModule,
  ],
})
export class StoragesPageModule {}
