/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { FormHelperModule } from '@app/modules/form-helper/form-helper.module';
import { ResourceModule } from '@app/modules/resource/resource.module';
import { SharedModule } from '@app/modules/shared/shared.module';
import { TrashModule } from '@app/modules/trash/trash.module';
import { UserModule } from '@app/modules/user/user.module';
import { getTranslocoModule } from '@app/transloco-testing.module';
import { FormsModule } from '@eworkbench/forms';
import {
  mockBookingDuration,
  mockBookingRuleBookableTimeSlotsPayload,
  mockBookingRuleBookingsPerUser,
  mockBookingRuleBookingsPerUserPayload,
  mockBookingRuleMaximumDurationPayload,
  mockBookingRuleMaximumTimeBeforePayload,
  mockBookingRuleMinimumDurationPayload,
  mockBookingRuleMinimumTimeBeforePayload,
  mockBookingRuleTimeBetweenPayload,
  mockBookingRuleTimeSlots,
  mockResource,
} from '@eworkbench/mocks';
import { ModalsModule } from '@eworkbench/modals';
import { TableModule } from '@eworkbench/table';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { ResourceBookingRulesComponent } from './booking-rules.component';

describe('ResourceBookingRulesComponent', () => {
  let spectator: Spectator<ResourceBookingRulesComponent>;
  const createComponent = createComponentFactory({
    component: ResourceBookingRulesComponent,
    imports: [
      HttpClientTestingModule,
      FormsModule,
      getTranslocoModule(),
      FormHelperModule,
      TableModule,
      UserModule,
      RouterTestingModule,
      SharedModule,
      TrashModule,
      ResourceModule,
      ModalsModule,
    ],
  });

  beforeEach(() => (spectator = createComponent()));

  it('should create', () => {
    expect(spectator).toBeTruthy();
  });

  it('should call getBookingRules()', () => {
    expect(spectator.component.getBookingRules()).toEqual(spectator.component.bookingRules);
  });

  it('should call onAdd()', () => {
    expect(spectator.component.bookableTimeSlots).toBeUndefined();
    spectator.component.rulesFormControl.patchValue('booking_rule_bookable_hours');
    spectator.component.onAdd();
    expect(spectator.component.bookableTimeSlots).not.toBeUndefined();

    expect(spectator.component.minimumDuration).toBeUndefined();
    spectator.component.rulesFormControl.patchValue('booking_rule_minimum_duration');
    spectator.component.onAdd();
    expect(spectator.component.minimumDuration).not.toBeUndefined();

    expect(spectator.component.maximumDuration).toBeUndefined();
    spectator.component.rulesFormControl.patchValue('booking_rule_maximum_duration');
    spectator.component.onAdd();
    expect(spectator.component.maximumDuration).not.toBeUndefined();

    expect(spectator.component.minimumTimeBefore).toBeUndefined();
    spectator.component.rulesFormControl.patchValue('booking_rule_minimum_time_before');
    spectator.component.onAdd();
    expect(spectator.component.minimumTimeBefore).not.toBeUndefined();

    expect(spectator.component.maximumTimeBefore).toBeUndefined();
    spectator.component.rulesFormControl.patchValue('booking_rule_maximum_time_before');
    spectator.component.onAdd();
    expect(spectator.component.maximumTimeBefore).not.toBeUndefined();

    expect(spectator.component.timeBetween).toBeUndefined();
    spectator.component.rulesFormControl.patchValue('booking_rule_time_between');
    spectator.component.onAdd();
    expect(spectator.component.timeBetween).not.toBeUndefined();

    expect(spectator.component.bookingsPerUser).toBeUndefined();
    spectator.component.rulesFormControl.patchValue('booking_rule_bookings_per_user');
    spectator.component.onAdd();
    expect(spectator.component.bookingsPerUser).not.toBeUndefined();
    expect(spectator.component.bookingsPerUser?.length).toBe(1);

    spectator.component.rulesFormControl.patchValue('random_value');
    spectator.component.onAdd();
  });

  it('should check the changed and button status', () => {
    expect(spectator.component.showButtons()).toEqual(false);
    spectator.component.onSetChanged();
    expect(spectator.component.showButtons()).toEqual(true);
    spectator.component.onCancel();
    expect(spectator.component.showButtons()).toEqual(false);
  });

  it('should call onRemove()', () => {
    expect(spectator.component.bookableTimeSlots).toBeUndefined();
    spectator.component.onRemove('booking_rule_bookable_hours');
    expect(spectator.component.bookableTimeSlots).toBeNull();

    expect(spectator.component.minimumDuration).toBeUndefined();
    spectator.component.onRemove('booking_rule_minimum_duration');
    expect(spectator.component.minimumDuration).toBeNull();

    expect(spectator.component.maximumDuration).toBeUndefined();
    spectator.component.onRemove('booking_rule_maximum_duration');
    expect(spectator.component.maximumDuration).toBeNull();

    expect(spectator.component.minimumTimeBefore).toBeUndefined();
    spectator.component.onRemove('booking_rule_minimum_time_before');
    expect(spectator.component.minimumTimeBefore).toBeNull();

    expect(spectator.component.maximumTimeBefore).toBeUndefined();
    spectator.component.onRemove('booking_rule_maximum_time_before');
    expect(spectator.component.maximumTimeBefore).toBeNull();

    expect(spectator.component.timeBetween).toBeUndefined();
    spectator.component.onRemove('booking_rule_time_between');
    expect(spectator.component.timeBetween).toBeNull();

    expect(spectator.component.bookingsPerUser).toBeUndefined();
    spectator.component.onRemove('booking_rule_bookings_per_user');
    expect(spectator.component.bookingsPerUser).toEqual([]);

    spectator.component.onRemove('random_value');
  });

  it('should call onChanged()', () => {
    expect(spectator.component.bookingRules.booking_rule_bookable_hours).toBeNull();
    spectator.component.onChanged(mockBookingRuleBookableTimeSlotsPayload);
    expect(spectator.component.bookingRules.booking_rule_bookable_hours).toEqual({
      id: mockBookingRuleBookableTimeSlotsPayload.id,
      ...mockBookingRuleBookableTimeSlotsPayload.values,
    });

    expect(spectator.component.bookingRules.booking_rule_minimum_duration).toBeNull();
    spectator.component.onChanged(mockBookingRuleMinimumDurationPayload);
    expect(spectator.component.bookingRules.booking_rule_minimum_duration).toEqual({
      id: mockBookingRuleMinimumDurationPayload.id,
      ...mockBookingRuleMinimumDurationPayload.values,
    });

    expect(spectator.component.bookingRules.booking_rule_maximum_duration).toBeNull();
    spectator.component.onChanged(mockBookingRuleMaximumDurationPayload);
    expect(spectator.component.bookingRules.booking_rule_maximum_duration).toEqual({
      id: mockBookingRuleMaximumDurationPayload.id,
      ...mockBookingRuleMaximumDurationPayload.values,
    });

    expect(spectator.component.bookingRules.booking_rule_minimum_time_before).toBeNull();
    spectator.component.onChanged(mockBookingRuleMinimumTimeBeforePayload);
    expect(spectator.component.bookingRules.booking_rule_minimum_time_before).toEqual({
      id: mockBookingRuleMinimumTimeBeforePayload.id,
      ...mockBookingRuleMinimumTimeBeforePayload.values,
    });

    expect(spectator.component.bookingRules.booking_rule_maximum_time_before).toBeNull();
    spectator.component.onChanged(mockBookingRuleMaximumTimeBeforePayload);
    expect(spectator.component.bookingRules.booking_rule_maximum_time_before).toEqual({
      id: mockBookingRuleMaximumTimeBeforePayload.id,
      ...mockBookingRuleMaximumTimeBeforePayload.values,
    });

    expect(spectator.component.bookingRules.booking_rule_time_between).toBeNull();
    spectator.component.onChanged(mockBookingRuleTimeBetweenPayload);
    expect(spectator.component.bookingRules.booking_rule_time_between).toEqual({
      id: mockBookingRuleTimeBetweenPayload.id,
      ...mockBookingRuleTimeBetweenPayload.values,
    });

    expect(spectator.component.bookingRules.booking_rule_bookings_per_user).toEqual([]);
    spectator.component.onChanged(mockBookingRuleBookingsPerUserPayload);
    expect(spectator.component.bookingRules.booking_rule_bookings_per_user).toEqual(mockBookingRuleBookingsPerUserPayload.values);

    spectator.component.onChanged({
      rule: 'random_value',
      values: null,
    });
  });

  it('should call setInitialState()', () => {
    spectator.component.setInitialState();
    expect(spectator.component.initialState.booking_rule_bookable_hours).toEqual(null);
    expect(spectator.component.initialState.booking_rule_bookings_per_user).toEqual([]);
    expect(spectator.component.initialState.booking_rule_minimum_duration).toEqual(null);
    expect(spectator.component.initialState.booking_rule_maximum_duration).toEqual(null);
    expect(spectator.component.initialState.booking_rule_minimum_time_before).toEqual(null);
    expect(spectator.component.initialState.booking_rule_maximum_time_before).toEqual(null);
    expect(spectator.component.initialState.booking_rule_time_between).toEqual(null);

    spectator.component.setInitialState(mockResource);
    expect(spectator.component.initialState.booking_rule_bookable_hours).toEqual(mockResource.booking_rule_bookable_hours);
    expect(spectator.component.initialState.booking_rule_bookings_per_user).toEqual(mockResource.booking_rule_bookings_per_user);
    expect(spectator.component.initialState.booking_rule_minimum_duration).toEqual(mockResource.booking_rule_minimum_duration);
    expect(spectator.component.initialState.booking_rule_maximum_duration).toEqual(mockResource.booking_rule_maximum_duration);
    expect(spectator.component.initialState.booking_rule_minimum_time_before).toEqual(mockResource.booking_rule_minimum_time_before);
    expect(spectator.component.initialState.booking_rule_maximum_time_before).toEqual(mockResource.booking_rule_maximum_time_before);
    expect(spectator.component.initialState.booking_rule_time_between).toEqual(mockResource.booking_rule_time_between);
  });

  it('should call showNoBookingRulesNotice()', () => {
    expect(spectator.component.showNoBookingRulesNotice()).toBe(true);

    spectator.setInput({
      bookableTimeSlots: null,
      bookingsPerUser: [],
      minimumDuration: null,
      maximumDuration: null,
      minimumTimeBefore: null,
      maximumTimeBefore: null,
      timeBetween: null,
    });
    expect(spectator.component.showNoBookingRulesNotice()).toBe(true);

    spectator.setInput({
      bookableTimeSlots: mockBookingRuleTimeSlots,
      bookingsPerUser: [],
      minimumDuration: null,
      maximumDuration: null,
      minimumTimeBefore: null,
      maximumTimeBefore: null,
      timeBetween: null,
    });
    expect(spectator.component.showNoBookingRulesNotice()).toBe(false);

    spectator.setInput({
      bookableTimeSlots: null,
      bookingsPerUser: mockBookingRuleBookingsPerUser,
      minimumDuration: null,
      maximumDuration: null,
      minimumTimeBefore: null,
      maximumTimeBefore: null,
      timeBetween: null,
    });
    expect(spectator.component.showNoBookingRulesNotice()).toBe(false);

    spectator.setInput({
      bookableTimeSlots: null,
      bookingsPerUser: [],
      minimumDuration: mockBookingDuration,
      maximumDuration: null,
      minimumTimeBefore: null,
      maximumTimeBefore: null,
      timeBetween: null,
    });
    expect(spectator.component.showNoBookingRulesNotice()).toBe(false);

    spectator.setInput({
      bookableTimeSlots: null,
      bookingsPerUser: [],
      minimumDuration: null,
      maximumDuration: mockBookingDuration,
      minimumTimeBefore: null,
      maximumTimeBefore: null,
      timeBetween: null,
    });
    expect(spectator.component.showNoBookingRulesNotice()).toBe(false);

    spectator.setInput({
      bookableTimeSlots: null,
      bookingsPerUser: [],
      minimumDuration: null,
      maximumDuration: null,
      minimumTimeBefore: mockBookingDuration,
      maximumTimeBefore: null,
      timeBetween: null,
    });
    expect(spectator.component.showNoBookingRulesNotice()).toBe(false);

    spectator.setInput({
      bookableTimeSlots: null,
      bookingsPerUser: [],
      minimumDuration: null,
      maximumDuration: null,
      minimumTimeBefore: null,
      maximumTimeBefore: mockBookingDuration,
      timeBetween: null,
    });
    expect(spectator.component.showNoBookingRulesNotice()).toBe(false);

    spectator.setInput({
      bookableTimeSlots: null,
      bookingsPerUser: [],
      minimumDuration: null,
      maximumDuration: null,
      minimumTimeBefore: null,
      maximumTimeBefore: null,
      timeBetween: mockBookingDuration,
    });
    expect(spectator.component.showNoBookingRulesNotice()).toBe(false);
  });
});
