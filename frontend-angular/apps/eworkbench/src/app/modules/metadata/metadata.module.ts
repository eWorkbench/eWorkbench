/* istanbul ignore file */

/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { CustomControlErrorComponent } from '@app/modules/shared/control-error/control-error.component';
import { TranslocoRootModule } from '@app/transloco-root.module';
import { FormsModule } from '@eworkbench/forms';
import { IconsModule } from '@eworkbench/icons';
import { ModalsModule } from '@eworkbench/modals';
import { WysiwygEditorModule } from '@eworkbench/wysiwyg-editor';
import { ErrorTailorModule } from '@ngneat/error-tailor';
import { TranslocoService } from '@ngneat/transloco';
import { AlertModule } from 'ngx-bootstrap/alert';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { FormHelperModule } from '../form-helper/form-helper.module';
import { LoadingModule } from '../loading/loading.module';
import { MetadataFieldHelperComponent } from './components/field-helper/field-helper.component';
import { MetadataFieldComponent } from './components/field/field.component';
import { MetadataComponent } from './components/metadata/metadata.component';
import { NewMetadataFieldComponent } from './components/modals/new/new.component';
import { MetadataSearchParameterComponent } from './components/search-parameter/search-parameter.component';

@NgModule({
  declarations: [
    MetadataSearchParameterComponent,
    MetadataComponent,
    MetadataFieldHelperComponent,
    MetadataFieldComponent,
    NewMetadataFieldComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    FormHelperModule,
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
    DragDropModule,
    WysiwygEditorModule,
    LoadingModule,
    ModalsModule,
    IconsModule,
    TooltipModule.forRoot(),
    AlertModule,
  ],
  exports: [
    MetadataSearchParameterComponent,
    MetadataComponent,
    MetadataFieldHelperComponent,
    MetadataFieldComponent,
    NewMetadataFieldComponent,
  ],
})
export class MetadataModule {}
