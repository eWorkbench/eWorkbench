/* istanbul ignore file */

/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ClipboardModule } from '@angular/cdk/clipboard';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslocoRootModule } from '@app/transloco-root.module';
import { FormsModule } from '@eworkbench/forms';
import { ModalsModule } from '@eworkbench/modals';
import { TableModule } from '@eworkbench/table';
import { IconsModule } from 'libs/icons/src/lib/icons.module';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { FormHelperModule } from '../form-helper/form-helper.module';
import { LoadingModule } from '../loading/loading.module';
import { SharedModule } from '../shared/shared.module';
import { TrashModule } from '../trash/trash.module';
import { AddFileModalComponent } from './components/modals/add-file/add-file.component';
import { DeleteStorageDirectoryModalComponent } from './components/modals/directory/delete/delete.component';
import { EditStorageDirectoryModalComponent } from './components/modals/directory/edit/edit.component';
import { NewStorageDirectoryModalComponent } from './components/modals/directory/new/new.component';
import { WebDavModalComponent } from './components/modals/web-dav/web-dav.component';
import { StorageElementComponent } from './components/storage-element/storage-element.component';
import { SubdirectoryElementComponent } from './components/subdirectory-element/subdirectory-element.component';
import { CreateTreePipe } from './pipes/create-tree/create-tree.pipe';
import { SubdirectoryCollapseElementComponent } from './components/subdirectory-collapse-element/subdirectory-collapse-element.component';
import { CollapseModule } from 'ngx-bootstrap/collapse';
import { UserModule } from '../user/user.module';

@NgModule({
  declarations: [
    CreateTreePipe,
    StorageElementComponent,
    SubdirectoryElementComponent,
    DeleteStorageDirectoryModalComponent,
    NewStorageDirectoryModalComponent,
    EditStorageDirectoryModalComponent,
    WebDavModalComponent,
    AddFileModalComponent,
    SubdirectoryCollapseElementComponent,
  ],
  imports: [
    CommonModule,
    LoadingModule,
    TooltipModule.forRoot(),
    SharedModule,
    IconsModule,
    FormsModule,
    FormHelperModule,
    ClipboardModule,
    TableModule,
    TranslocoRootModule,
    ModalsModule,
    RouterModule,
    TrashModule,
    CollapseModule.forRoot(),
    UserModule,
  ],
  exports: [
    CreateTreePipe,
    StorageElementComponent,
    SubdirectoryElementComponent,
    DeleteStorageDirectoryModalComponent,
    NewStorageDirectoryModalComponent,
    EditStorageDirectoryModalComponent,
    WebDavModalComponent,
    AddFileModalComponent,
  ],
})
export class StorageModule {}
