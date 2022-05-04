/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { TranslocoRootModule } from '@app/transloco-root.module';
import { FormsModule } from '@eworkbench/forms';
import { IconsModule } from '@eworkbench/icons';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { FormAsteriskComponent } from './components/form-asterisk/form-asterisk.component';
import { FormDateGroupComponent } from './components/form-date-group/form-date-group.component';
import { FormDateInputComponent } from './components/form-date-input/form-date-input.component';
import { FormInputComponent } from './components/form-input/form-input.component';
import { FormTimeGroupComponent } from './components/form-time-group/form-time-group.component';

@NgModule({
  declarations: [FormInputComponent, FormAsteriskComponent, FormDateGroupComponent, FormDateInputComponent, FormTimeGroupComponent],
  imports: [CommonModule, FormsModule, IconsModule, TooltipModule.forRoot(), TranslocoRootModule],
  exports: [FormInputComponent, FormAsteriskComponent, FormDateGroupComponent, FormDateInputComponent, FormTimeGroupComponent],
})
export class FormHelperModule {}
