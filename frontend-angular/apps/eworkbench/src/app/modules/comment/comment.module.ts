/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { TranslocoRootModule } from '@app/transloco-root.module';
import { FormsModule } from '@eworkbench/forms';
import { IconsModule } from '@eworkbench/icons';
import { ModalsModule } from '@eworkbench/modals';
import { SkeletonsModule } from '@eworkbench/skeletons';
import { TableModule } from '@eworkbench/table';
import { WysiwygEditorModule } from '@eworkbench/wysiwyg-editor';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { ToastrModule } from 'ngx-toastr';
import { CommentComponent } from './components/comment/comment.component';
import { CommentsComponent } from './components/comments/comments.component';
import { CreateCommentComponent } from './components/create-comment/create-comment.component';
import { CommentsModalComponent } from './components/modals/comments/comments.component';
import { DeleteCommentModalComponent } from './components/modals/delete/delete.component';
import { NewCommentModalComponent } from './components/modals/new/new.component';
import { FormHelperModule } from '../form-helper/form-helper.module';
import { LoadingModule } from '../loading/loading.module';
import { SharedModule } from '../shared/shared.module';
import { UserModule } from '../user/user.module';

@NgModule({
  declarations: [
    CommentComponent,
    CreateCommentComponent,
    CommentsComponent,
    CommentsModalComponent,
    NewCommentModalComponent,
    DeleteCommentModalComponent,
  ],
  imports: [
    CommonModule,
    TranslocoRootModule,
    FormsModule,
    FormHelperModule,
    WysiwygEditorModule,
    SharedModule,
    UserModule,
    ModalsModule,
    LoadingModule,
    IconsModule,
    SkeletonsModule,
    TableModule,
    TooltipModule.forRoot(),
    ToastrModule,
  ],
  exports: [CommentComponent, CommentsComponent, CommentsModalComponent, NewCommentModalComponent, DeleteCommentModalComponent],
})
export class CommentModule {}
