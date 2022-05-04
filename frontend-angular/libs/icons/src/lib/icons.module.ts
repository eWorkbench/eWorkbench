/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { IconComponent } from './components/icon/icon.component';

@NgModule({
  declarations: [IconComponent],
  imports: [CommonModule],
  exports: [IconComponent],
})
export class IconsModule {}
