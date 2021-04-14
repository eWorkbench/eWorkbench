/* istanbul ignore file */

/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EditorModule, TINYMCE_SCRIPT_SRC } from '@tinymce/tinymce-angular';
import { WysiwygEditorComponent } from './components/wysiwyg-editor/wysiwyg-editor.component';
import { ReactiveFormsModule } from '@angular/forms';

@NgModule({
  declarations: [WysiwygEditorComponent],
  imports: [CommonModule, EditorModule, ReactiveFormsModule],
  exports: [EditorModule, WysiwygEditorComponent],
  providers: [{ provide: TINYMCE_SCRIPT_SRC, useValue: 'tinymce/tinymce.min.js' }],
})
export class WysiwygEditorModule {}
