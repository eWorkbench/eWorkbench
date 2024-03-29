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
import { SkeletonsModule } from '@eworkbench/skeletons';
import { TableModule } from '@eworkbench/table';
import { WysiwygEditorModule } from '@eworkbench/wysiwyg-editor';
import { AlertModule } from 'ngx-bootstrap/alert';
import { CollapseModule } from 'ngx-bootstrap/collapse';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { PopoverModule } from 'ngx-bootstrap/popover';
import { TabsModule } from 'ngx-bootstrap/tabs';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { LinkListComponent } from './components/link-list/link-list.component';
import { LinkComponent } from './components/link/link.component';
import { DeleteLinkComponent } from './components/modals/delete-link/delete-link.component';
import { NewLinkModalComponent } from './components/modals/new/new.component';
import { SearchContentComponent } from './components/search-content/search-content.component';
import { CommentModule } from '../comment/comment.module';
import { FormHelperModule } from '../form-helper/form-helper.module';
import { LoadingModule } from '../loading/loading.module';
import { SharedModule } from '../shared/shared.module';
import { TaskModule } from '../task/task.module';
import { UserModule } from '../user/user.module';

@NgModule({
  declarations: [LinkComponent, LinkListComponent, NewLinkModalComponent, SearchContentComponent, DeleteLinkComponent],
  imports: [
    CommonModule,
    RouterModule,
    TranslocoRootModule,
    IconsModule,
    ModalsModule,
    CollapseModule.forRoot(),
    BsDropdownModule.forRoot(),
    TooltipModule.forRoot(),
    WysiwygEditorModule,
    FormsModule,
    FormHelperModule,
    TableModule,
    SharedModule,
    UserModule,
    LoadingModule,
    TabsModule.forRoot(),
    TaskModule,
    AlertModule.forRoot(),
    CommentModule,
    SkeletonsModule,
    PopoverModule.forRoot(),
  ],
  exports: [LinkComponent, LinkListComponent],
})
export class LinkModule {}
