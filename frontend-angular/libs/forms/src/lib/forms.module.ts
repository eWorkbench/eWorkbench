/* istanbul ignore file */

/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule as AngularFormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgOptionHighlightModule } from '@ng-select/ng-option-highlight';
import { OverlayModule } from '@angular/cdk/overlay';
import { ColorPickerModule } from 'ngx-color-picker';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    AngularFormsModule,
    ReactiveFormsModule,
    OverlayModule,
    NgSelectModule,
    NgOptionHighlightModule,
    ColorPickerModule,
  ],
  exports: [AngularFormsModule, ReactiveFormsModule, OverlayModule, NgSelectModule, NgOptionHighlightModule, ColorPickerModule],
})
export class FormsModule {}
