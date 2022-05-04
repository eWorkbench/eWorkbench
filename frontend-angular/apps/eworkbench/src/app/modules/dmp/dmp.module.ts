/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { TranslocoRootModule } from '@app/transloco-root.module';
import { IconsModule } from '@eworkbench/icons';
import { DMPStatusComponent } from './components/dmp-status/dmp-status.component';
import { SharedModule } from '../shared/shared.module';

@NgModule({
  declarations: [DMPStatusComponent],
  imports: [CommonModule, SharedModule, TranslocoRootModule, IconsModule],
  exports: [DMPStatusComponent],
})
export class DMPModule {}
