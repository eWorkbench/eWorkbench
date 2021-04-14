/* istanbul ignore file */

/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { HeaderModule } from '@app/modules/header/header.module';
import { TranslocoRootModule } from '@app/transloco-root.module';
import { IconsModule } from '@eworkbench/icons';
import { Error404PageComponent } from './components/error-404-page/error-404-page.component';
import { ErrorPageRoutingModule } from './error-routing.module';

@NgModule({
  declarations: [Error404PageComponent],
  imports: [CommonModule, ErrorPageRoutingModule, TranslocoRootModule, HeaderModule, IconsModule],
})
export class ErrorPageModule {}
