/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { TranslocoRootModule } from '@app/transloco-root.module';
import { IconsModule } from '@eworkbench/icons';
import { DssImportOptionComponent } from './components/dss-import-option/dss-import-option.component';
import { DssReadWriteSettingComponent } from './components/dss-read-write-setting/dss-read-write-setting.component';
import { SharedModule } from '../shared/shared.module';

@NgModule({
  declarations: [DssReadWriteSettingComponent, DssImportOptionComponent],
  imports: [CommonModule, SharedModule, TranslocoRootModule, IconsModule],
  exports: [DssReadWriteSettingComponent, DssImportOptionComponent],
})
export class DssContainerModule {}
