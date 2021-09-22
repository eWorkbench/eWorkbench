/* istanbul ignore file */

/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { getTranslocoModule } from '@app/transloco-testing.module';
import { IconsModule } from '@eworkbench/icons';
import { ModalsModule } from '@eworkbench/modals';
import { CollapseModule } from 'ngx-bootstrap/collapse';
import { CollapseElementComponent } from './collapse-element/collapse-element.component';
import { CustomControlErrorComponent } from './control-error/control-error.component';
import { DetailsCollapseElementComponent } from './details-collapse-element/details-collapse-element.component';
import { AuthDownloadDirective } from './directives/auth-download/auth-download.directive';
import { AutoFocusDirective } from './directives/auto-focus/auto-focus.directive';
import { EllipsisElementComponent } from './ellipsis/ellipsis-element.component';
import { FilterSidebarComponent } from './filter-sidebar/filter-sidebar.component';
import { PendingChangesModalComponent } from './modals/pending-changes/pending-changes.component';
import { FormatContentTypeModelPipe } from './pipes/content-type-model/content-type-model.pipe';
import { FormatDatePipe } from './pipes/format-date/format-date.pipe';
import { FormatFileSizePipe } from './pipes/format-file-size/format-file-size.pipe';
import { FormatSpeakingDatePipe } from './pipes/format-speaking-date/format-speaking-date.pipe';
import { SafeHtmlPipe } from './pipes/safe-html/safe-html.pipe';
import { StripHTMLPipe } from './pipes/strip-html/strip-html.pipe';
import { SecondaryCollapseElementComponent } from './secondary-collapse-element/secondary-collapse-element.component';
import { CustomToastComponent } from './toastr/toastr.component';
import { TrashedItemsFilterComponent } from './trashed-items-filter/trashed-items-filter.component';

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
    EllipsisElementComponent,
    AuthDownloadDirective,
    SafeHtmlPipe,
    PendingChangesModalComponent,
    TrashedItemsFilterComponent,
    FilterSidebarComponent,
    AutoFocusDirective,
  ],
  imports: [CommonModule, getTranslocoModule(), IconsModule, CollapseModule.forRoot(), ModalsModule],
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
    EllipsisElementComponent,
    AuthDownloadDirective,
    SafeHtmlPipe,
    PendingChangesModalComponent,
    TrashedItemsFilterComponent,
    FilterSidebarComponent,
    AutoFocusDirective,
  ],
})
export class SharedModule {}
