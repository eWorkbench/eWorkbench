/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { IconsModule } from '@eworkbench/icons';
import { ResizableModule } from 'angular-resizable-element';
import { CollapseModule } from 'ngx-bootstrap/collapse';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { ColorPickerModule } from 'ngx-color-picker';
import { PictureEditorDetailsDropdownComponent } from './components/picture-editor-details-dropdown/picture-editor-details-dropdown.component';
import { PictureEditorToolbarComponent } from './components/picture-editor-toolbar/picture-editor-toolbar.component';
import { PictureEditorComponent } from './components/picture-editor/picture-editor.component';

@NgModule({
  declarations: [PictureEditorComponent, PictureEditorToolbarComponent, PictureEditorDetailsDropdownComponent],
  imports: [
    CommonModule,
    IconsModule,
    ResizableModule,
    TooltipModule.forRoot(),
    BsDropdownModule.forRoot(),
    CollapseModule,
    ColorPickerModule,
  ],
  exports: [PictureEditorComponent],
})
export class PictureEditorModule {}
