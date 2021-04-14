/* istanbul ignore file */

/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarComponent } from './components/calendar/calendar.component';

@NgModule({
  declarations: [CalendarComponent],
  imports: [CommonModule, FullCalendarModule],
  exports: [FullCalendarModule, CalendarComponent],
})
export class CalendarModule {}
