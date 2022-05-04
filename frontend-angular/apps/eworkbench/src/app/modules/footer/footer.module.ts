/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { RouterModule } from '@angular/router';
import { TranslocoRootModule } from '@app/transloco-root.module';
import { FooterComponent } from './components/footer/footer.component';

@NgModule({
  declarations: [FooterComponent],
  imports: [CommonModule, RouterModule, TranslocoRootModule],
  exports: [FooterComponent],
})
export class FooterModule {}
