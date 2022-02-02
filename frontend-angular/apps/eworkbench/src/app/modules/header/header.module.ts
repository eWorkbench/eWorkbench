/* istanbul ignore file */

/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { IconsModule } from '@eworkbench/icons';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { CMSModule } from '../cms/cms.module';
import { SharedModule } from '../shared/shared.module';
import { HeaderComponent } from './components/header/header.component';

@NgModule({
  declarations: [HeaderComponent],
  imports: [CommonModule, IconsModule, RouterModule, CMSModule, SharedModule, TooltipModule.forRoot()],
  exports: [HeaderComponent],
})
export class HeaderModule {}
