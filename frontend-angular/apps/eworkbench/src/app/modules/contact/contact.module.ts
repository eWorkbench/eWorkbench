/* istanbul ignore file */

/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoRootModule } from '@app/transloco-root.module';
import { MergeDuplicatesInputGroupComponent } from './components/merge-duplicates-input-group/merge-duplicates-input-group.component';
import { FormsModule } from '@eworkbench/forms';
import { FormHelperModule } from '../form-helper/form-helper.module';
import { WysiwygEditorModule } from '@eworkbench/wysiwyg-editor';

@NgModule({
  declarations: [MergeDuplicatesInputGroupComponent],
  imports: [CommonModule, TranslocoRootModule, FormsModule, FormHelperModule, WysiwygEditorModule],
  exports: [MergeDuplicatesInputGroupComponent],
})
export class ContactModule {}
