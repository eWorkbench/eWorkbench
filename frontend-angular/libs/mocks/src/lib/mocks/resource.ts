/* istanbul ignore file */

/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { DjangoAPI, RecentChanges, Resource, ResourceBooking, ResourcePayload } from '@eworkbench/types';
import { mockUser } from './user';

export const mockResourcePayload: ResourcePayload = {
  name: 'New resource',
  owner_agreement: true,
  projects: [],
  type: 'ROOM',
  user_availability: 'GLB',
  user_availability_selected_user_group_pks: [],
  user_availability_selected_user_pks: [],
};

export const mockResource: Resource = {
  location: '',
  contact: '',
  url: 'http://rewriteqa.tum.anx-cus.net/api/resources/47a42a8c-4bc9-48c2-8d4b-ec272c8e5dd0/',
  booking_rule_bookable_hours: null,
  booking_rule_time_between: null,
  version_number: 1,
  user_availability_selected_user_pks: [],
  branch_library: '',
  content_type: 19,
  booking_rule_maximum_time_before: null,
  name: 'Resource name test',
  type: 'ROOM',
  description: '',
  metadata: [],
  user_availability: 'GLB',
  user_availability_selected_user_group_pks: [],
  download_terms_of_use:
    'http://rewriteqa.tum.anx-cus.net/api/resources/47a42a8c-4bc9-48c2-8d4b-ec272c8e5dd0/terms-of-use-download/?jwt=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJleHAiOjE2MDMxMTkwNDUsInBrIjoiNDdhNDJhOGMtNGJjOS00OGMyLThkNGItZWMyNzJjOGU1ZGQwIiwib2JqZWN0X3R5cGUiOiJSZXNvdXJjZSIsInVzZXIiOjE1MCwiand0X3ZlcmlmaWNhdGlvbl90b2tlbiI6IjNjMTIzYmYyM2M2MzQxNDA5YzExNTJhZDcxZGY1MDQxIiwicGF0aCI6Ii9hcGkvcmVzb3VyY2VzLzQ3YTQyYThjLTRiYzktNDhjMi04ZDRiLWVjMjcyYzhlNWRkMC90ZXJtcy1vZi11c2UtZG93bmxvYWQvIn0.aJUGSQboWknJYRqqHW6bJukkdQyIJUvDjTz0-oq5Hqg',
  booking_rule_bookings_per_user: [],
  last_modified_by: mockUser,
  study_room: false,
  created_at: '2020-10-19T13:32:49.989116+02:00',
  user_availability_selected_user_groups: [],
  responsible_unit: '',
  booking_rule_maximum_duration: null,
  deleted: false,
  user_availability_selected_users: [],
  display: 'Resource Resource name test',
  booking_rule_minimum_duration: null,
  pk: '47a42a8c-4bc9-48c2-8d4b-ec272c8e5dd0',
  content_type_model: 'projects.resource',
  projects: [],
  last_modified_at: '2020-10-19T13:50:45.511546+02:00',
  terms_of_use_pdf: null,
  booking_rule_minimum_time_before: null,
  created_by: mockUser,
  calendar_interval: 30,
  is_favourite: false,
};

export const mockResourcesList: DjangoAPI<Resource[]> = {
  count: 1,
  next: null,
  previous: null,
  results: [mockResource],
};

export const mockResourceHistory: DjangoAPI<RecentChanges[]> = {
  count: 2,
  next: null,
  previous: null,
  results: [
    {
      pk: '0d39118c-1357-407a-a901-5f032cdaf60f',
      user: mockUser,
      object_type: { id: 19, app_label: 'projects', model: 'resource' },
      object_uuid: '47a42a8c-4bc9-48c2-8d4b-ec272c8e5dd0',
      changeset_type: 'U',
      date: '2020-10-19T13:50:45.521591+02:00',
      change_records: [{ field_name: 'name', old_value: 'Resource name', new_value: 'Resource name test' }],
    },
  ],
};

export const mockResourceBooking: ResourceBooking = {
  date_time_start: '2020-09-10T07:00:00+02:00',
  location: '',
  url: 'http://rewriteqa.tum.anx-cus.net/api/meetings/8fdac2a0-5a04-462f-a22c-d8b147b1b336/',
  resource_pk: '3ee4bb25-558e-4939-ba5c-051c2fff4365',
  attending_users: [mockUser],
  date_time_end: '2020-09-10T08:00:00+02:00',
  version_number: 5,
  title: 'Appointment',
  content_type: 34,
  attending_users_pk: [159, 150],
  metadata: [],
  attending_contacts: [],
  resource: mockResource,
  last_modified_by: mockUser,
  scheduled_notification: {
    display: 'Scheduled Notification on 2020-09-10 04:45:00+00:00 for 8fdac2a0-5a04-462f-a22c-d8b147b1b336',
    pk: 'e21b1df4-fd76-45eb-b82b-d11ac636a704',
    object_id: '8fdac2a0-5a04-462f-a22c-d8b147b1b336',
    timedelta_value: 15,
    content_type_model: 'notifications.schedulednotification',
    scheduled_date_time: '2020-09-10T06:45:00+02:00',
    processed: false,
    active: false,
    timedelta_unit: 'MINUTE',
    deleted: false,
    content_type: 76,
  },
  attending_contacts_pk: [],
  created_at: '2020-09-09T08:44:55.508793+02:00',
  deleted: false,
  display: 'Appointment',
  pk: '8fdac2a0-5a04-462f-a22c-d8b147b1b336',
  text: '',
  content_type_model: 'shared_elements.meeting',
  projects: [],
  last_modified_at: '2020-11-12T10:20:58.573275+01:00',
  created_by: mockUser,
};

export const mockResourceBookingsList: DjangoAPI<ResourceBooking[]> = {
  count: 1,
  next: null,
  previous: null,
  results: [mockResourceBooking],
};
