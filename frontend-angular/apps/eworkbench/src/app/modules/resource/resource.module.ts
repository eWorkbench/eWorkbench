/* istanbul ignore file */

/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormHelperModule } from '@app/modules/form-helper/form-helper.module';
import { SharedModule } from '@app/modules/shared/shared.module';
import { TrashModule } from '@app/modules/trash/trash.module';
import { UserModule } from '@app/modules/user/user.module';
import { TranslocoRootModule } from '@app/transloco-root.module';
import { CalendarModule } from '@eworkbench/calendar';
import { FormsModule } from '@eworkbench/forms';
import { IconsModule } from '@eworkbench/icons';
import { ModalsModule } from '@eworkbench/modals';
import { TableModule } from '@eworkbench/table';
import { PopoverModule } from 'ngx-bootstrap/popover';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { FavoritesModule } from '../favorites/favorites.module';
import { AllResourceBookingsComponent } from './components/all-bookings/all-bookings.component';
import { ResourceBookingCalendarComponent } from './components/booking-calendar/booking-calendar.component';
import { ResourceBookingRulesBookableTimeSlotInputComponent } from './components/booking-rules-bookable-time-slot-input/booking-rules-bookable-time-slot-input.component';
import { ResourceBookingRulesBookableTimeSlotsComponent } from './components/booking-rules-bookable-time-slots/booking-rules-bookable-time-slots.component';
import { ResourceBookingRulesBookingsPerUserElementComponent } from './components/booking-rules-bookings-per-user-element/booking-rules-bookings-per-user-element.component';
import { ResourceBookingRulesBookingsPerUserComponent } from './components/booking-rules-bookings-per-user/booking-rules-bookings-per-user.component';
import { ResourceBookingRulesDurationComponent } from './components/booking-rules-duration/booking-rules-duration.component';
import { ResourceBookingRulesComponent } from './components/booking-rules/booking-rules.component';
import { RemoveResourcePDFModalComponent } from './components/modals/remove-pdf/remove-pdf.component';
import { MyResourceBookingsComponent } from './components/my-bookings/my-bookings.component';
import { ResourceAvailabilityComponent } from './components/resource-availability/resource-availability.component';
import { ResourceTypeComponent } from './components/resource-type/resource-type.component';

@NgModule({
  declarations: [
    ResourceBookingRulesComponent,
    ResourceBookingRulesDurationComponent,
    ResourceBookingRulesBookableTimeSlotsComponent,
    ResourceBookingRulesBookableTimeSlotInputComponent,
    ResourceBookingRulesBookingsPerUserComponent,
    ResourceBookingRulesBookingsPerUserElementComponent,
    MyResourceBookingsComponent,
    RemoveResourcePDFModalComponent,
    ResourceBookingCalendarComponent,
    ResourceTypeComponent,
    ResourceAvailabilityComponent,
    AllResourceBookingsComponent,
  ],
  imports: [
    CommonModule,
    TranslocoRootModule,
    FormsModule,
    FormHelperModule,
    TableModule,
    UserModule,
    RouterModule,
    SharedModule,
    TrashModule,
    ModalsModule,
    CalendarModule,
    IconsModule,
    TooltipModule.forRoot(),
    PopoverModule.forRoot(),
    FavoritesModule,
  ],
  exports: [
    ResourceBookingRulesComponent,
    ResourceBookingRulesDurationComponent,
    ResourceBookingRulesBookableTimeSlotsComponent,
    ResourceBookingRulesBookingsPerUserComponent,
    ResourceBookingRulesBookingsPerUserElementComponent,
    MyResourceBookingsComponent,
    RemoveResourcePDFModalComponent,
    ResourceBookingCalendarComponent,
    ResourceTypeComponent,
    ResourceAvailabilityComponent,
    AllResourceBookingsComponent,
  ],
})
export class ResourceModule {}
