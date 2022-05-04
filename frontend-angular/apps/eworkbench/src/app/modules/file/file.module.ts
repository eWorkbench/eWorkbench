/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { TranslocoRootModule } from '@app/transloco-root.module';
import { IconsModule } from '@eworkbench/icons';
import { FileIconComponent } from './components/file-icon/file-icon.component';
import { SharedModule } from '../shared/shared.module';

@NgModule({
  declarations: [FileIconComponent],
  imports: [CommonModule, SharedModule, TranslocoRootModule, IconsModule],
  exports: [FileIconComponent],
})
export class FileModule {}
