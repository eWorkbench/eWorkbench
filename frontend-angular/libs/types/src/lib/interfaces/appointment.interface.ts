/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Contact } from './contact.interface';
import { Metadata } from './metadata.interface';
import { User } from './user.interface';

export interface AppointmentScheduledNotification {
  active: boolean;
  content_type: number;
  content_type_model: string;
  deleted: boolean;
  display: string;
  object_id: string;
  pk: string;
  processed: boolean;
  scheduled_date_time: string;
  timedelta_unit: 'MINUTE' | 'HOUR' | 'DAY' | 'WEEK';
  timedelta_value: number;
}

export interface Appointment {
  attending_contacts: Contact[];
  attending_contacts_pk: string[];
  attending_users: User[];
  attending_users_pk: number[];
  content_type: number;
  content_type_model: string;
  created_at: string | null;
  created_by: User;
  date_time_end: string | null;
  date_time_start: string | null;
  full_day: boolean;
  deleted: boolean;
  display: string;
  last_modified_at: string | null;
  last_modified_by: User;
  location: string | null;
  metadata: Metadata[];
  pk: string;
  projects: string[];
  resource: any;
  resource_pk: string | null;
  scheduled_notification: AppointmentScheduledNotification | null;
  text: string;
  title: string;
  url: string;
  version_number: number;
}

export interface AppointmentPayload {
  attending_contacts_pk: string[];
  attending_users_pk: number[];
  date_time_end: string | null;
  date_time_start: string | null;
  full_day: boolean;
  location: string | null;
  metadata?: Metadata[];
  projects: string[];
  resource_pk?: string | null;
  text: string;
  title: string;
  scheduled_notification_writable?: {
    active: boolean;
    timedelta_value: number | null;
    timedelta_unit: 'MINUTE' | 'HOUR' | 'DAY' | 'WEEK' | null;
  };
}
