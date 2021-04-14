/* istanbul ignore file */

/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PicturesPageRoutingModule } from './pictures-page-routing.module';
import { PicturesPageComponent } from './components/pictures-page/pictures-page.component';
import { UserModule } from '@app/modules/user/user.module';
import { TranslocoRootModule } from '@app/transloco-root.module';
import { HeaderModule } from '@app/modules/header/header.module';
import { TableModule } from '@eworkbench/table';
import { FormsModule } from '@eworkbench/forms';
import { TrashModule } from '@app/modules/trash/trash.module';
import { LoadingModule } from '@app/modules/loading/loading.module';
import { LockModule } from '@app/modules/lock/lock.module';
import { FormHelperModule } from '@app/modules/form-helper/form-helper.module';
import { ModalsModule } from '@eworkbench/modals';
import { SharedModule } from '@app/modules/shared/shared.module';
import { DetailsDropdownModule } from '@app/modules/details-dropdown/details-dropdown.module';
import { WysiwygEditorModule } from '@eworkbench/wysiwyg-editor';
import { VersionsModule } from '@app/modules/versions/versions.module';
import { RecentChangesModule } from '@app/modules/recent-changes/recent-changes.module';
import { ErrorTailorModule } from '@ngneat/error-tailor';
import { CustomControlErrorComponent } from '@app/modules/shared/control-error/control-error.component';
import { TranslocoService } from '@ngneat/transloco';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { MetadataModule } from '@app/modules/metadata/metadata.module';
import { ProjectModule } from '@app/modules/project/project.module';
import { LabelModule } from '@app/modules/label/label.module';
import { PicturePageComponent } from './components/picture-page/picture-page.component';
import { IconsModule } from '@eworkbench/icons';
import { NewPictureModalComponent } from './components/modals/new/new.component';
import { SkeletonsModule } from '@eworkbench/skeletons';
import { LinkModule } from '@app/modules/link/link.module';
import { PictureEditorModule } from '@eworkbench/picture-editor';
import { SketchPictureModalComponent } from './components/modals/sketch/sketch.component';
import { ConvertTiffModalComponent } from './components/modals/convert-tiff/convert-tiff.component';

@NgModule({
  declarations: [
    PicturesPageComponent,
    PicturePageComponent,
    NewPictureModalComponent,
    SketchPictureModalComponent,
    ConvertTiffModalComponent,
  ],
  imports: [
    CommonModule,
    PicturesPageRoutingModule,
    TranslocoRootModule,
    HeaderModule,
    TableModule,
    FormsModule,
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
    TrashModule,
    UserModule,
    LoadingModule,
    LockModule,
    FormHelperModule,
    ModalsModule,
    SharedModule,
    DetailsDropdownModule,
    WysiwygEditorModule,
    RecentChangesModule,
    VersionsModule,
    BsDropdownModule.forRoot(),
    MetadataModule,
    ProjectModule,
    LabelModule,
    IconsModule,
    SkeletonsModule,
    LinkModule,
    PictureEditorModule,
  ],
})
export class PicturesPageModule {}
