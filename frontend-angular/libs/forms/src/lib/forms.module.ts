/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { OverlayModule } from '@angular/cdk/overlay';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule as AngularFormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgOptionHighlightModule } from '@ng-select/ng-option-highlight';
import { NgSelectModule } from '@ng-select/ng-select';
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
