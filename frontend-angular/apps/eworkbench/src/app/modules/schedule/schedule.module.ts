/* istanbul ignore file */

/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../shared/shared.module';
import { TranslocoRootModule } from '@app/transloco-root.module';
import { ExportModalComponent } from './components/modals/export/export.component';
import { ModalsModule } from '@eworkbench/modals';
import { FormsModule } from '@eworkbench/forms';
import { FormHelperModule } from '../form-helper/form-helper.module';

@NgModule({
  declarations: [ExportModalComponent],
  imports: [CommonModule, SharedModule, TranslocoRootModule, ModalsModule, FormsModule, FormHelperModule],
  exports: [ExportModalComponent],
})
export class ScheduleModule {}
