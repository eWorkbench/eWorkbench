/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { TranslocoRootModule } from '@app/transloco-root.module';
import { FormsModule } from '@eworkbench/forms';
import { ModalsModule } from '@eworkbench/modals';
import { ExportModalComponent } from './components/modals/export/export.component';
import { FormHelperModule } from '../form-helper/form-helper.module';
import { SharedModule } from '../shared/shared.module';

@NgModule({
  declarations: [ExportModalComponent],
  imports: [CommonModule, SharedModule, TranslocoRootModule, ModalsModule, FormsModule, FormHelperModule],
  exports: [ExportModalComponent],
})
export class ScheduleModule {}
