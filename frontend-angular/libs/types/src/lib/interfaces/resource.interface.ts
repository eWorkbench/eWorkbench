/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Metadata } from './metadata.interface';
import { UserGroup } from './user-group.interface';
import { User } from './user.interface';

export interface ResourcePayload {
  name?: string | null;
  owner_agreement?: boolean;
  type?: 'ROOM' | 'LABEQ' | 'OFFEQ' | 'ITRES';
  contact?: string | null;
  responsible_unit?: string | null;
  location?: string | null;
  description?: string | null;
  user_availability?: 'GLB' | 'USR' | 'PRJ';
  user_availability_selected_user_group_pks?: number[] | null;
  user_availability_selected_user_pks?: number[] | null;
  booking_rule_bookable_hours?: BookingRuleBookableTimeSlots | null;
  booking_rule_bookings_per_user?: BookingRuleBookingsPerUser[];
  booking_rule_minimum_duration?: BookingRuleDuration | null;
  booking_rule_maximum_duration?: BookingRuleDuration | null;
  booking_rule_minimum_time_before?: BookingRuleDuration | null;
  booking_rule_maximum_time_before?: BookingRuleDuration | null;
  booking_rule_time_between?: BookingRuleDuration | null;
  terms_of_use_pdf?: string | null;
  projects?: string[];
  metadata?: Metadata[];
  calendar_interval?: number;
}

export interface Resource {
  location: string;
  contact: string;
  url: string;
  version_number: number;
  user_availability_selected_user_pks: number[] | null;
  branch_library: string;
  content_type: number;
  name: string;
  type: 'ROOM' | 'LABEQ' | 'OFFEQ' | 'ITRES';
  description: string;
  metadata: Metadata[];
  user_availability: 'GLB' | 'USR' | 'PRJ';
  user_availability_selected_user_group_pks: number[] | null;
  download_terms_of_use: string;
  last_modified_by: User;
  study_room: boolean;
  created_at: string;
  user_availability_selected_user_groups: UserGroup[];
  responsible_unit: string;
  deleted: boolean;
  user_availability_selected_users: User[];
  display: string;
  pk: string;
  content_type_model: string;
  projects: string[];
  last_modified_at: string;
  terms_of_use_pdf: string | null;
  created_by: User;
  booking_rule_bookable_hours: BookingRuleBookableTimeSlots[];
  booking_rule_bookings_per_user: BookingRuleBookingsPerUser[];
  booking_rule_minimum_duration: BookingRuleDuration | null;
  booking_rule_maximum_duration: BookingRuleDuration | null;
  booking_rule_minimum_time_before: BookingRuleDuration | null;
  booking_rule_maximum_time_before: BookingRuleDuration | null;
  booking_rule_time_between: BookingRuleDuration | null;
  color?: string;
  calendar_interval: number;
  is_favourite: boolean;
}

export interface BookingRuleDuration {
  id?: string | null;
  duration: string;
}

export interface BookingRuleBookingsPerUser {
  id?: string | null;
  uuid?: string | null;
  count: number | null;
  unit: 'DAY' | 'WEEK' | 'MONTH' | null;
}

export interface BookingRuleBookableTimeSlots {
  id?: string | null;
  weekday: string | null;
  full_day: boolean;
  time_start: string | null;
  time_end: string | null;
}

export interface BookingRulePayload {
  id?: string | null;
  uuid?: string | null;
  rule: string;
  values: BookingRuleBookableTimeSlots[] | BookingRuleBookingsPerUser[] | BookingRuleBookingsPerUser | BookingRuleDuration | null;
}

export interface BookingRulesPayload {
  booking_rule_bookable_hours: BookingRuleBookableTimeSlots[];
  booking_rule_bookings_per_user: BookingRuleBookingsPerUser[];
  booking_rule_minimum_duration: BookingRuleDuration | null;
  booking_rule_maximum_duration: BookingRuleDuration | null;
  booking_rule_minimum_time_before: BookingRuleDuration | null;
  booking_rule_maximum_time_before: BookingRuleDuration | null;
  booking_rule_time_between: BookingRuleDuration | null;
}
