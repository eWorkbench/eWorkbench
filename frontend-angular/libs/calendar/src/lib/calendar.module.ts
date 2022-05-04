/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FullCalendarModule } from '@fullcalendar/angular';
import { PopoverModule } from 'ngx-bootstrap/popover';
import { CalendarComponent } from './components/calendar/calendar.component';
import { CalendarPopoverWrapperComponent } from './components/popover/popover.component';

@NgModule({
  declarations: [CalendarComponent, CalendarPopoverWrapperComponent],
  imports: [CommonModule, FullCalendarModule, PopoverModule.forRoot()],
  exports: [FullCalendarModule, CalendarComponent, CalendarPopoverWrapperComponent],
})
export class CalendarModule {}
