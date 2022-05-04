/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type {
  BookingRuleBookableTimeSlots,
  BookingRuleBookingsPerUser,
  BookingRuleDuration,
  BookingRulePayload,
  BookingRulesPayload,
} from '@eworkbench/types';

export const mockBookingRuleBookableTimeSlotsPayload: BookingRulePayload = {
  id: 'a9eee3f0-d38d-42d1-bbb4-e4b29ee95751',
  rule: 'booking_rule_bookable_hours',
  values: [
    {
      weekday: 'MON',
      time_start: '06:00',
      time_end: '18:00',
      full_day: false,
    },
  ],
};

export const mockBookingRuleTimeSlots: BookingRuleBookableTimeSlots[] = [
  {
    id: 'a9eee3f0-d38d-42d1-bbb4-e4b29ee95751',
    weekday: 'MON',
    time_start: '06:00',
    time_end: '18:00',
    full_day: false,
  },
];

export const mockBookingRuleMinimumDurationPayload: BookingRulePayload = {
  id: 'a9eee3f0-d38d-42d1-bbb4-e4b29ee95751',
  rule: 'booking_rule_minimum_duration',
  values: {
    duration: '01:00:00',
  },
};

export const mockBookingRuleMaximumDurationPayload: BookingRulePayload = {
  id: 'a9eee3f0-d38d-42d1-bbb4-e4b29ee95751',
  rule: 'booking_rule_maximum_duration',
  values: {
    duration: '01:00:00',
  },
};

export const mockBookingRuleMinimumTimeBeforePayload: BookingRulePayload = {
  id: 'a9eee3f0-d38d-42d1-bbb4-e4b29ee95751',
  rule: 'booking_rule_minimum_time_before',
  values: {
    duration: '01:00:00',
  },
};

export const mockBookingRuleMaximumTimeBeforePayload: BookingRulePayload = {
  id: 'a9eee3f0-d38d-42d1-bbb4-e4b29ee95751',
  rule: 'booking_rule_maximum_time_before',
  values: {
    duration: '01:00:00',
  },
};

export const mockBookingRuleTimeBetweenPayload: BookingRulePayload = {
  id: 'a9eee3f0-d38d-42d1-bbb4-e4b29ee95751',
  rule: 'booking_rule_time_between',
  values: {
    duration: '01:00:00',
  },
};

export const mockBookingDuration: BookingRuleDuration = {
  id: 'a9eee3f0-d38d-42d1-bbb4-e4b29ee95751',
  duration: '01:00:00',
};

export const mockBookingRuleBookingsPerUserPayload: BookingRulePayload = {
  id: 'a9eee3f0-d38d-42d1-bbb4-e4b29ee95751',
  rule: 'booking_rule_bookings_per_user',
  values: [
    {
      count: 1,
      unit: 'DAY',
    },
  ],
};

export const mockBookingRuleBookingsPerUser: BookingRuleBookingsPerUser[] = [
  {
    id: 'a9eee3f0-d38d-42d1-bbb4-e4b29ee95751',
    count: 1,
    unit: 'DAY',
  },
  {
    uuid: '4d0073d6-e0cf-41ae-b419-bcab12dc41bf',
    count: 2,
    unit: 'WEEK',
  },
];

export const mockBookingRulePerUserDay: BookingRuleBookingsPerUser = {
  id: 'a9eee3f0-d38d-42d1-bbb4-e4b29ee95751',
  count: 1,
  unit: 'DAY',
};

export const mockBookingRulePerUserWeek: BookingRuleBookingsPerUser = {
  uuid: '4d0073d6-e0cf-41ae-b419-bcab12dc41bf',
  count: 2,
  unit: 'WEEK',
};

export const mockBookingRulePerUserMonth: BookingRuleBookingsPerUser = {
  uuid: 'fc10e60f-5704-4aef-a78f-d674cbcc0c18',
  count: 5,
  unit: 'MONTH',
};

export const mockBookingRulesPayload: BookingRulesPayload = {
  booking_rule_bookable_hours: [],
  booking_rule_bookings_per_user: [],
  booking_rule_minimum_duration: null,
  booking_rule_maximum_duration: null,
  booking_rule_minimum_time_before: null,
  booking_rule_maximum_time_before: null,
  booking_rule_time_between: null,
};
