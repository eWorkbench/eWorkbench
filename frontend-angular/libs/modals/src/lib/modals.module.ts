/* istanbul ignore file */

/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { DialogModule } from '@ngneat/dialog';
import { ModalComponent } from './components/modal/modal.component';

@NgModule({
  declarations: [ModalComponent],
  imports: [CommonModule, DialogModule.forRoot()],
  exports: [DialogModule, ModalComponent],
})
export class ModalsModule {}
