/* istanbul ignore file */

/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { TranslocoRootModule } from '@app/transloco-root.module';
import { FormsModule } from '@eworkbench/forms';
import { IconsModule } from '@eworkbench/icons';
import { ModalsModule } from '@eworkbench/modals';
import { WysiwygEditorModule } from '@eworkbench/wysiwyg-editor';
import { CollapseModule } from 'ngx-bootstrap/collapse';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { FormHelperModule } from '../form-helper/form-helper.module';
import { LoadingModule } from '../loading/loading.module';
import { UserModule } from '../user/user.module';
import { PluginAccessibilityLabelComponent } from './component/accessibility-label/label.component';
import { PluginDataComponent } from './component/data/data.component';
import { PluginDetailsDropdownComponent } from './component/details-dropdown/details-dropdown.component';
import { PluginDetailsComponent } from './component/details/details.component';
import { PluginFeedbackComponent } from './component/feedback/feedback.component';
import { PluginDetailsModalComponent } from './component/modals/details/details.component';
import { PluginPreviewComponent } from './component/preview/preview.component';
import { PluginSmallPreviewComponent } from './component/small-preview/small-preview.component';

@NgModule({
  declarations: [
    PluginDataComponent,
    PluginPreviewComponent,
    PluginSmallPreviewComponent,
    PluginDetailsComponent,
    PluginAccessibilityLabelComponent,
    PluginDetailsModalComponent,
    PluginFeedbackComponent,
    PluginDetailsDropdownComponent,
  ],
  imports: [
    CommonModule,
    UserModule,
    TranslocoRootModule,
    ModalsModule,
    WysiwygEditorModule,
    LoadingModule,
    FormsModule,
    FormHelperModule,
    IconsModule,
    CollapseModule.forRoot(),
    BsDropdownModule.forRoot(),
  ],
  exports: [
    PluginDataComponent,
    PluginPreviewComponent,
    PluginSmallPreviewComponent,
    PluginDetailsComponent,
    PluginAccessibilityLabelComponent,
    PluginDetailsModalComponent,
    PluginFeedbackComponent,
    PluginDetailsDropdownComponent,
  ],
})
export class PluginModule {}
