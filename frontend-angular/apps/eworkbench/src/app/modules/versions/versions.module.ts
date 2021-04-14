/* istanbul ignore file */

/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { CustomControlErrorComponent } from '@app/modules/shared/control-error/control-error.component';
import { TranslocoRootModule } from '@app/transloco-root.module';
import { FormsModule } from '@eworkbench/forms';
import { IconsModule } from '@eworkbench/icons';
import { ModalsModule } from '@eworkbench/modals';
import { TableModule } from '@eworkbench/table';
import { WysiwygEditorModule } from '@eworkbench/wysiwyg-editor';
import { ErrorTailorModule } from '@ngneat/error-tailor';
import { TranslocoService } from '@ngneat/transloco';
import { AlertModule } from 'ngx-bootstrap/alert';
import { DMPModule } from '../dmp/dmp.module';
import { LabelModule } from '../label/label.module';
import { LoadingModule } from '../loading/loading.module';
import { MetadataModule } from '../metadata/metadata.module';
import { SharedModule } from '../shared/shared.module';
import { TaskModule } from '../task/task.module';
import { UserModule } from '../user/user.module';
import { FinalizeVersionModalComponent } from './components/modals/finalize/finalize.component';
import { VersionPreviewModalComponent } from './components/modals/preview/preview.component';
import { AppointmentPreviewComponent } from './components/previews/appointment/appointment.component';
import { ContactPreviewComponent } from './components/previews/contact/contact.component';
import { DMPPreviewComponent } from './components/previews/dmp/dmp.component';
import { FilePreviewComponent } from './components/previews/file/file.component';
import { LabBookPreviewComponent } from './components/previews/labbook/labbook.component';
import { NotePreviewComponent } from './components/previews/note/note.component';
import { PicturePreviewComponent } from './components/previews/picture/picture.component';
import { PluginDataPreviewComponent } from './components/previews/plugin-data/plugin-data.component';
import { TaskPreviewComponent } from './components/previews/task/task.component';
import { VersionsComponent } from './components/versions/versions.component';

@NgModule({
  declarations: [
    VersionsComponent,
    VersionPreviewModalComponent,
    FinalizeVersionModalComponent,
    ContactPreviewComponent,
    NotePreviewComponent,
    AppointmentPreviewComponent,
    TaskPreviewComponent,
    LabBookPreviewComponent,
    PluginDataPreviewComponent,
    FilePreviewComponent,
    PicturePreviewComponent,
    DMPPreviewComponent,
  ],
  imports: [
    CommonModule,
    ModalsModule,
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
    TableModule,
    UserModule,
    SharedModule,
    LoadingModule,
    FormsModule,
    WysiwygEditorModule,
    AlertModule.forRoot(),
    IconsModule,
    MetadataModule,
    TaskModule,
    LabelModule,
    DMPModule,
  ],
  exports: [
    VersionsComponent,
    VersionPreviewModalComponent,
    FinalizeVersionModalComponent,
    ContactPreviewComponent,
    NotePreviewComponent,
    AppointmentPreviewComponent,
    TaskPreviewComponent,
    LabBookPreviewComponent,
    PluginDataPreviewComponent,
    FilePreviewComponent,
    PicturePreviewComponent,
    DMPPreviewComponent,
  ],
})
/* istanbul ignore next */
export class VersionsModule {}
