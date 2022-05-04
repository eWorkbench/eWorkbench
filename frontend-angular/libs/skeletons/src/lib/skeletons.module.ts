/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { CalendarSkeletonComponent } from './components/calendar/calendar.component';
import { CommentSkeletonComponent } from './components/comment/comment.component';
import { DetailsSkeletonComponent } from './components/details/details.component';
import { LabbookSkeletonComponent } from './components/labbook/labbook.component';
import { LinkSkeletonComponent } from './components/link/link.component';
import { ListSkeletonComponent } from './components/list/list.component';
import { SidebarSkeletonComponent } from './components/sidebar/sidebar.component';
import { TaskBoardSkeletonComponent } from './components/task-board/task-board.component';
import { WysiwygSkeletonComponent } from './components/wysiwyg/wysiwyg.component';

@NgModule({
  declarations: [
    DetailsSkeletonComponent,
    WysiwygSkeletonComponent,
    ListSkeletonComponent,
    CommentSkeletonComponent,
    LinkSkeletonComponent,
    TaskBoardSkeletonComponent,
    CalendarSkeletonComponent,
    LabbookSkeletonComponent,
    SidebarSkeletonComponent,
  ],
  imports: [CommonModule],
  exports: [
    DetailsSkeletonComponent,
    WysiwygSkeletonComponent,
    ListSkeletonComponent,
    CommentSkeletonComponent,
    LinkSkeletonComponent,
    TaskBoardSkeletonComponent,
    CalendarSkeletonComponent,
    LabbookSkeletonComponent,
    SidebarSkeletonComponent,
  ],
})
export class SkeletonsModule {}
