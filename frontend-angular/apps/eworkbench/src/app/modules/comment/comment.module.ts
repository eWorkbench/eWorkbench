/* istanbul ignore file */

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
import { WysiwygEditorModule } from '@eworkbench/wysiwyg-editor';
import { FormHelperModule } from '../form-helper/form-helper.module';
import { LoadingModule } from '../loading/loading.module';
import { SharedModule } from '../shared/shared.module';
import { UserModule } from '../user/user.module';
import { CommentComponent } from './components/comment/comment.component';
import { CommentsComponent } from './components/comments/comments.component';
import { CommentsModalComponent } from './components/modals/comments/comments.component';
import { NewCommentComponent } from './components/new/new.component';

@NgModule({
  declarations: [CommentComponent, CommentsComponent, CommentsModalComponent, NewCommentComponent],
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
  ],
  exports: [CommentComponent, CommentsComponent, CommentsModalComponent, NewCommentComponent],
})
export class CommentModule {}
