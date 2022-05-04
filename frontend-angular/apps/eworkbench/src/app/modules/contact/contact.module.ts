/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { TranslocoRootModule } from '@app/transloco-root.module';
import { FormsModule } from '@eworkbench/forms';
import { WysiwygEditorModule } from '@eworkbench/wysiwyg-editor';
import { MergeDuplicatesInputGroupComponent } from './components/merge-duplicates-input-group/merge-duplicates-input-group.component';
import { FormHelperModule } from '../form-helper/form-helper.module';

@NgModule({
  declarations: [MergeDuplicatesInputGroupComponent],
  imports: [CommonModule, TranslocoRootModule, FormsModule, FormHelperModule, WysiwygEditorModule],
  exports: [MergeDuplicatesInputGroupComponent],
})
export class ContactModule {}
