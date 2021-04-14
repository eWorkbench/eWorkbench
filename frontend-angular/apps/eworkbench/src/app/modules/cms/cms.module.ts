/* istanbul ignore file */

/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslocoRootModule } from '@app/transloco-root.module';
import { IconsModule } from '@eworkbench/icons';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { SharedModule } from '../shared/shared.module';
import { MaintenanceComponent } from './components/maintenance/maintenance.component';

@NgModule({
  declarations: [MaintenanceComponent],
  imports: [CommonModule, RouterModule, IconsModule, SharedModule, TooltipModule.forRoot(), TranslocoRootModule],
  exports: [MaintenanceComponent],
})
export class CMSModule {}
