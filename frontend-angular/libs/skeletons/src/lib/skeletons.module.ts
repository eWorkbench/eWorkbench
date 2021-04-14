/* istanbul ignore file */

/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { PageSkeletonComponent } from './components/page/page.component';

@NgModule({
  declarations: [PageSkeletonComponent],
  imports: [CommonModule],
  exports: [PageSkeletonComponent],
})
export class SkeletonsModule {}
