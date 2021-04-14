/* istanbul ignore file */

/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { TranslocoRootModule } from '@app/transloco-root.module';
import { ModalsModule } from '@eworkbench/modals';
import { PictureEditorModule } from '@eworkbench/picture-editor';
import { IconsModule } from 'libs/icons/src/lib/icons.module';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { LoadingModule } from '../loading/loading.module';
import { SharedModule } from '../shared/shared.module';
import { PictureEditorModalComponent } from './modals/editor.component';

@NgModule({
  declarations: [PictureEditorModalComponent],
  imports: [
    CommonModule,
    LoadingModule,
    TooltipModule.forRoot(),
    SharedModule,
    IconsModule,
    TranslocoRootModule,
    ModalsModule,
    PictureEditorModule,
  ],
  exports: [PictureEditorModalComponent],
})
export class PictureModule {}
