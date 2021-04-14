/* istanbul ignore file */

/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { GanttChartComponent } from './components/gantt-chart/gantt-chart.component';

@NgModule({
  declarations: [GanttChartComponent],
  imports: [CommonModule],
  exports: [GanttChartComponent],
})
export class GanttChartModule {}
