/* istanbul ignore file */

/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CustomControlErrorComponent } from '@app/modules/shared/control-error/control-error.component';
import { TranslocoRootModule } from '@app/transloco-root.module';
import { FormsModule } from '@eworkbench/forms';
import { IconsModule } from '@eworkbench/icons';
import { ModalsModule } from '@eworkbench/modals';
import { PictureEditorModule } from '@eworkbench/picture-editor';
import { TableModule } from '@eworkbench/table';
import { WysiwygEditorModule } from '@eworkbench/wysiwyg-editor';
import { ErrorTailorModule } from '@ngneat/error-tailor';
import { TranslocoService } from '@ngneat/transloco';
import { GridsterModule } from 'angular-gridster2';
import { AlertModule } from 'ngx-bootstrap/alert';
import { CollapseModule } from 'ngx-bootstrap/collapse';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { CommentModule } from '../comment/comment.module';
import { FormHelperModule } from '../form-helper/form-helper.module';
import { LoadingModule } from '../loading/loading.module';
import { LockModule } from '../lock/lock.module';
import { PictureModule } from '../picture/picture.module';
import { PluginModule } from '../plugin/plugin.module';
import { SharedModule } from '../shared/shared.module';
import { UserModule } from '../user/user.module';
import { LabBookDrawBoardComponent } from './components/draw-board/draw-board/draw-board.component';
import { LabBookDrawBoardElementComponent } from './components/draw-board/element/element.component';
import { LabBookDrawBoardFileComponent } from './components/draw-board/file/file.component';
import { LabBookDrawBoardGridComponent } from './components/draw-board/grid/grid.component';
import { LabBookPendingChangesModalComponent } from './components/draw-board/modals/pending-changes/pending-changes.component';
import { LabBookDrawBoardNoteComponent } from './components/draw-board/note/note.component';
import { LabBookDrawBoardPermissionDeniedComponent } from './components/draw-board/permission-denied/permission-denied.component';
import { LabBookDrawBoardPictureComponent } from './components/draw-board/picture/picture.component';
import { LabBookDrawBoardPluginDataComponent } from './components/draw-board/plugin-data/plugin-data.component';
import { LabBookSearchBarComponent } from './components/draw-board/search-bar/search-bar.component';
import { LabBookDrawBoardSectionComponent } from './components/draw-board/section/section.component';
import { LabBookElementDropdownComponent } from './components/element-dropdown/element-dropdown.component';
import { DeleteLabBookSectionElementModalComponent } from './components/modals/delete-section/delete-section.component';
import { ImportLabBookElementsModalComponent } from './components/modals/import-elements/import-elements.component';
import { MoveLabBookElementToLabBookModalComponent } from './components/modals/move/element-to-labbook/element-to-labbook.component';
import { MoveLabBookElementToSectionModalComponent } from './components/modals/move/element-to-section/element-to-section.component';
import { NewLabBookFileElementModalComponent } from './components/modals/new/file/new.component';
import { NewLabBookNoteElementModalComponent } from './components/modals/new/note/new.component';
import { NewLabBookPictureElementModalComponent } from './components/modals/new/picture/new.component';
import { NewLabBookPluginElementModalComponent } from './components/modals/new/plugin/new.component';
import { NewLabBookSectionElementModalComponent } from './components/modals/new/section/new.component';
import { NewLabBookSketchModalComponent } from './components/modals/new/sketch/new.component';
import { LabBookElementRemoveModalComponent } from './components/modals/remove/remove.component';
import { LabBookSidebarComponent } from './components/sidebar/sidebar.component';

@NgModule({
  declarations: [
    LabBookSidebarComponent,
    NewLabBookSectionElementModalComponent,
    NewLabBookNoteElementModalComponent,
    LabBookDrawBoardComponent,
    LabBookSidebarComponent,
    LabBookDrawBoardElementComponent,
    LabBookDrawBoardSectionComponent,
    LabBookDrawBoardNoteComponent,
    LabBookElementDropdownComponent,
    LabBookElementRemoveModalComponent,
    ImportLabBookElementsModalComponent,
    LabBookDrawBoardGridComponent,
    DeleteLabBookSectionElementModalComponent,
    MoveLabBookElementToSectionModalComponent,
    MoveLabBookElementToLabBookModalComponent,
    NewLabBookPluginElementModalComponent,
    LabBookDrawBoardPluginDataComponent,
    LabBookDrawBoardFileComponent,
    LabBookDrawBoardPictureComponent,
    NewLabBookFileElementModalComponent,
    NewLabBookPictureElementModalComponent,
    LabBookSearchBarComponent,
    NewLabBookSketchModalComponent,
    LabBookDrawBoardPermissionDeniedComponent,
    LabBookPendingChangesModalComponent,
  ],
  imports: [
    CommonModule,
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
    LoadingModule,
    SharedModule,
    RouterModule,
    WysiwygEditorModule,
    GridsterModule,
    CollapseModule.forRoot(),
    BsDropdownModule.forRoot(),
    IconsModule,
    LockModule,
    PluginModule,
    AlertModule,
    PictureModule,
    CommentModule,
    PictureEditorModule,
    ModalsModule,
    LoadingModule,
  ],
  exports: [
    LabBookSidebarComponent,
    NewLabBookSectionElementModalComponent,
    NewLabBookNoteElementModalComponent,
    LabBookDrawBoardComponent,
    LabBookSidebarComponent,
    LabBookDrawBoardElementComponent,
    LabBookDrawBoardSectionComponent,
    LabBookDrawBoardNoteComponent,
    LabBookElementDropdownComponent,
    LabBookElementRemoveModalComponent,
    ImportLabBookElementsModalComponent,
    LabBookDrawBoardGridComponent,
    DeleteLabBookSectionElementModalComponent,
    MoveLabBookElementToSectionModalComponent,
    MoveLabBookElementToLabBookModalComponent,
    NewLabBookPluginElementModalComponent,
    LabBookDrawBoardPluginDataComponent,
    LabBookDrawBoardFileComponent,
    LabBookDrawBoardPictureComponent,
    NewLabBookFileElementModalComponent,
    NewLabBookPictureElementModalComponent,
    LabBookSearchBarComponent,
    NewLabBookSketchModalComponent,
    LabBookDrawBoardPermissionDeniedComponent,
    LabBookPendingChangesModalComponent,
  ],
})
export class LabBookModule {}
