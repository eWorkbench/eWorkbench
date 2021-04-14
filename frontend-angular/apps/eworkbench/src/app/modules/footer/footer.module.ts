/* istanbul ignore file */

/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { FooterComponent } from './components/footer/footer.component';
import { RouterModule } from '@angular/router';
import { TranslocoRootModule } from '@app/transloco-root.module';

@NgModule({
  declarations: [FooterComponent],
  imports: [CommonModule, RouterModule, TranslocoRootModule],
  exports: [FooterComponent],
})
export class FooterModule {}
