/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { TranslocoRootModule } from '@app/transloco-root.module';
import { getTranslocoModule } from '@app/transloco-testing.module';
import { FormsModule } from '@eworkbench/forms';
import { IconsModule } from '@eworkbench/icons';
import { ModalsModule } from '@eworkbench/modals';
import { WysiwygEditorModule } from '@eworkbench/wysiwyg-editor';
import { CollapseModule } from 'ngx-bootstrap/collapse';
import { CollapseElementComponent } from './collapse-element/collapse-element.component';
import { CustomControlErrorComponent } from './control-error/control-error.component';
import { DetailsCollapseElementComponent } from './details-collapse-element/details-collapse-element.component';
import { AuthDownloadDirective } from './directives/auth-download/auth-download.directive';
import { AutoFocusDirective } from './directives/auto-focus/auto-focus.directive';
import { EllipsisDirective } from './directives/ellipsis/ellipsis.directive';
import { FilterSidebarComponent } from './filter-sidebar/filter-sidebar.component';
import { DescriptionModalComponent } from './modals/description/description.component';
import { PendingChangesModalComponent } from './modals/pending-changes/pending-changes.component';
import { OverviewCollapseElementComponent } from './overview-collapse-element/overview-collapse-element.component';
import { FormatContentTypeModelPipe } from './pipes/content-type-model/content-type-model.pipe';
import { FormatDatePipe } from './pipes/format-date/format-date.pipe';
import { FormatFileSizePipe } from './pipes/format-file-size/format-file-size.pipe';
import { FormatSpeakingDatePipe } from './pipes/format-speaking-date/format-speaking-date.pipe';
import { SafeHtmlPipe } from './pipes/safe-html/safe-html.pipe';
import { StripHTMLPipe } from './pipes/strip-html/strip-html.pipe';
import { SecondaryCollapseElementComponent } from './secondary-collapse-element/secondary-collapse-element.component';
import { CustomToastComponent } from './toastr/toastr.component';
import { TrashedItemsFilterComponent } from './trashed-items-filter/trashed-items-filter.component';
import { LoadingModule } from '../loading/loading.module';

@NgModule({
  declarations: [
    FormatDatePipe,
    FormatSpeakingDatePipe,
    FormatContentTypeModelPipe,
    StripHTMLPipe,
    CustomControlErrorComponent,
    CustomToastComponent,
    FormatFileSizePipe,
    CollapseElementComponent,
    SecondaryCollapseElementComponent,
    DetailsCollapseElementComponent,
    AuthDownloadDirective,
    SafeHtmlPipe,
    PendingChangesModalComponent,
    TrashedItemsFilterComponent,
    FilterSidebarComponent,
    AutoFocusDirective,
    OverviewCollapseElementComponent,
    EllipsisDirective,
    DescriptionModalComponent,
  ],
  imports: [
    CommonModule,
    getTranslocoModule(),
    IconsModule,
    CollapseModule.forRoot(),
    ModalsModule,
    TranslocoRootModule,
    LoadingModule,
    WysiwygEditorModule,
    FormsModule,
  ],
  exports: [
    FormatDatePipe,
    FormatSpeakingDatePipe,
    FormatContentTypeModelPipe,
    StripHTMLPipe,
    CustomControlErrorComponent,
    CustomToastComponent,
    FormatFileSizePipe,
    CollapseElementComponent,
    SecondaryCollapseElementComponent,
    DetailsCollapseElementComponent,
    AuthDownloadDirective,
    SafeHtmlPipe,
    PendingChangesModalComponent,
    TrashedItemsFilterComponent,
    FilterSidebarComponent,
    AutoFocusDirective,
    OverviewCollapseElementComponent,
    EllipsisDirective,
    DescriptionModalComponent,
  ],
})
export class SharedModule {}
