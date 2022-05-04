/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type { AppointmentScheduledNotification } from './appointment.interface';
import type { Contact } from './contact.interface';
import type { Metadata } from './metadata.interface';
import type { Project } from './project.interface';
import type { Resource } from './resource.interface';
import type { User } from './user.interface';

export interface ResourceBooking {
  attending_contacts: Contact[];
  attending_contacts_pk: string[];
  attending_users: User[];
  attending_users_pk: number[];
  content_type: number;
  content_type_model: string;
  created_at: string;
  created_by: User;
  date_time_end: string;
  date_time_start: string;
  deleted: boolean;
  display: string;
  last_modified_at: string;
  last_modified_by: User;
  location: string | null;
  metadata: Metadata[];
  pk: string;
  projects: Project[];
  resource: Omit<
    Resource,
    | 'attending_users'
    | 'url'
    | 'version_number'
    | 'branch_library'
    | 'description'
    | 'metadata'
    | 'general_usage_setting'
    | 'download_terms_of_use'
    | 'study_room'
    | 'deleted'
    | 'projects'
    | 'terms_of_use_pdf'
    | 'booking_rule_bookable_hours'
    | 'booking_rule_bookings_per_user'
    | 'booking_rule_minimum_duration'
    | 'booking_rule_maximum_duration'
    | 'booking_rule_minimum_time_before'
    | 'booking_rule_maximum_time_before'
    | 'booking_rule_time_between'
  >;
  resource_pk: string;
  scheduled_notification: AppointmentScheduledNotification;
  text: string;
  title: string;
  url: string;
  version_number: number;
}
