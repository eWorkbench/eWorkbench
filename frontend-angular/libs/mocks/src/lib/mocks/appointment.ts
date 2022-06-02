/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type { Appointment, AppointmentPayload, DjangoAPI, RecentChanges, Version } from '@eworkbench/types';
import type { DateSelectArg, DatesSetArg } from '@fullcalendar/angular';
import { mockUser } from './user';

export const mockAppointmentPayload: AppointmentPayload = {
  attending_contacts_pk: [],
  attending_users_pk: [],
  date_time_end: '2020-01-01 12:00',
  date_time_start: '2020-01-01 10:00',
  location: 'Test',
  projects: [],
  resource_pk: '11bf5b37-e0b8-42e0-8dcf-dc8c4aefc000',
  scheduled_notification_writable: {
    active: true,
    timedelta_unit: 'MINUTE',
    timedelta_value: 10,
  },
  text: 'Description',
  title: 'Appointment',
  full_day: false,
};

export const mockAppointment: Appointment = {
  location: null,
  text: '',
  metadata: [],
  pk: 'd09f27fe-9ab4-4c72-949c-741855010d37',
  last_modified_at: '2020-05-11T11:58:00.428835+02:00',
  projects: [],
  attending_contacts_pk: [],
  date_time_end: '2020-05-16T08:00:00+02:00',
  display: 'Appointment',
  version_number: 0,
  content_type_model: 'shared_elements.meeting',
  deleted: false,
  content_type: 34,
  attending_contacts: [],
  resource_pk: null,
  url: 'http://localhost:8000/api/meetings/d09f27fe-9ab4-4c72-949c-741855010d37/',
  scheduled_notification: null,
  resource: null,
  title: 'Appointment',
  attending_users: [],
  date_time_start: '2020-05-16T06:00:00+02:00',
  attending_users_pk: [],
  created_at: '2020-05-11T11:58:00.428781+02:00',
  created_by: mockUser,
  last_modified_by: mockUser,
  full_day: false,
  is_favourite: false,
};

export const mockAppointmentsList: DjangoAPI<Appointment[]> = {
  count: 1,
  next: null,
  previous: null,
  results: [mockAppointment],
};

export const mockAppointmentHistory: DjangoAPI<RecentChanges[]> = {
  count: 1,
  next: null,
  previous: null,
  results: [
    {
      pk: '15d6fd4e-9d23-41d0-a135-27495df1c6a8',
      user: mockUser,
      object_type: { id: 34, app_label: 'shared_elements', model: 'meeting' },
      object_uuid: 'dc116d89-960a-45f3-b6a6-fb997a931eb6',
      changeset_type: 'I',
      date: '2020-05-13T11:21:11.923194+02:00',
      change_records: [
        { field_name: 'attending_contacts', old_value: null, new_value: '' },
        { field_name: 'attending_users', old_value: null, new_value: '' },
        { field_name: 'date_time_end', old_value: null, new_value: '2020-05-13 13:30:00+02:00' },
        { field_name: 'date_time_start', old_value: null, new_value: '2020-05-13 13:00:00+02:00' },
        { field_name: 'deleted', old_value: null, new_value: 'False' },
        { field_name: 'location', old_value: null, new_value: 'Arbeitsplatz' },
        { field_name: 'metadata', old_value: null, new_value: '[]' },
        { field_name: 'projects', old_value: null, new_value: '' },
        { field_name: 'resource', old_value: null, new_value: null },
        { field_name: 'text', old_value: null, new_value: '' },
        { field_name: 'title', old_value: null, new_value: 'Test' },
      ],
    },
  ],
};

export const mockAppointmentVersion: Version = {
  content_type_model: 'versions.version',
  last_modified_by: mockUser,
  created_at: '2020-07-07T11:49:55.434092+02:00',
  number: 1,
  object_id: 'dc116d89-960a-45f3-b6a6-fb997a931eb6',
  created_by: mockUser,
  metadata: {
    text: '',
    title: 'Test',
    location: 'Arbeitsplatz',
    metadata: [],
    projects: [],
    resource: null,
    end_date_time: '2020-05-13T11:30:00+00:00',
    attending_users: [150],
    start_date_time: '2020-05-13T11:00:00+00:00',
    metadata_version: 2,
    attending_contacts: [],
  },
  pk: '4082a375-96ba-48ba-b1a6-1f9112b426ee',
  last_modified_at: '2020-07-07T11:49:55.434126+02:00',
  display: 'Version 1 of Test',
  content_type: 58,
  summary: '',
  content_type_pk: 34,
};

export const mockAppointmentStartDate = new Date();

export const mockAppointmentEndDate = new Date(mockAppointmentStartDate.getTime() + 24 * 60 * 60 * 1000); // 24 hours difference in milliseconds

export const mockAppointmentDatesSetEvent: DatesSetArg = {
  end: mockAppointmentEndDate,
  endStr: mockAppointmentEndDate.toISOString(),
  start: mockAppointmentStartDate,
  startStr: mockAppointmentStartDate.toISOString(),
  timeZone: 'local',
  // @ts-expect-error
  view: {
    calendar: {} as any,
    getCurrentData: {},
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    getOption: () => {},
    title: 'July 2020',
    dateEnv: {
      calendarSystem: {},
      canComputeOffset: true,
      cmdFormatter: null,
      defaultSeparator: ' - ',
      locale: {
        codeArg: 'en-US',
        codes: ['en-US'],
        options: {
          allDayText: 'all-day',
          buttonText: {
            day: 'day',
            list: 'list',
            month: 'month',
            next: 'next',
            nextYear: 'next year',
            prev: 'prev',
            prevYear: 'prev year',
            today: 'today',
            week: 'week',
            year: 'year',
          },
          direction: 'ltr',
          moreLinkText: 'more',
          noEventsText: 'No events to display',
          weekText: 'W',
        },
        simpleNumberFormat: {},
        week: { dow: 0, doy: 4 },
      },
      timeZone: 'local',
      weekDow: 1,
      weekDoy: 4,
      weekText: 'W',
    },
    type: 'dayGridMonth',
    activeEnd: mockAppointmentEndDate,
    activeStart: mockAppointmentStartDate,
    currentEnd: mockAppointmentEndDate,
    currentStart: mockAppointmentStartDate,
  },
};

export const mockAppointmentStartDateDetails = {
  year: mockAppointmentStartDate.getFullYear(),
  month: (mockAppointmentStartDate.getMonth() + 1).toString().padStart(2, '0'),
  day: mockAppointmentStartDate.getDate().toString().padStart(2, '0'),
  hours: mockAppointmentStartDate.getHours().toString().padStart(2, '0'),
  minutes: mockAppointmentStartDate.getMinutes().toString().padStart(2, '0'),
  seconds: mockAppointmentStartDate.getSeconds().toString().padStart(2, '0'),
};

export const mockAppointmentEndDateDetails = {
  year: mockAppointmentEndDate.getFullYear(),
  month: (mockAppointmentEndDate.getMonth() + 1).toString().padStart(2, '0'),
  day: mockAppointmentEndDate.getDate().toString().padStart(2, '0'),
  hours: mockAppointmentEndDate.getHours().toString().padStart(2, '0'),
  minutes: mockAppointmentEndDate.getMinutes().toString().padStart(2, '0'),
  seconds: mockAppointmentEndDate.getSeconds().toString().padStart(2, '0'),
};

export const mockAppointmentRangePartialEvent: DateSelectArg = {
  start: mockAppointmentStartDate,
  end: mockAppointmentEndDate,
  startStr: `${mockAppointmentStartDateDetails.year}-${mockAppointmentStartDateDetails.month}-${mockAppointmentStartDateDetails.day}`,
  endStr: `${mockAppointmentEndDateDetails.year}-${mockAppointmentEndDateDetails.month}-${mockAppointmentEndDateDetails.day}`,
  allDay: false,
  jsEvent: null,
  view: mockAppointmentDatesSetEvent.view,
};

export const mockAppointmentRangeFullDayEvent: DateSelectArg = {
  start: new Date(mockAppointmentStartDate.getFullYear(), mockAppointmentStartDate.getMonth(), mockAppointmentStartDate.getDate(), 0, 0, 0),
  end: new Date(mockAppointmentEndDate.getFullYear(), mockAppointmentEndDate.getMonth(), mockAppointmentEndDate.getDate(), 0, 0, 0),
  startStr: `${mockAppointmentStartDateDetails.year}-${mockAppointmentStartDateDetails.month}-${mockAppointmentStartDateDetails.day}`,
  endStr: `${mockAppointmentEndDateDetails.year}-${mockAppointmentEndDateDetails.month}-${mockAppointmentEndDateDetails.day}`,
  allDay: true,
  jsEvent: null,
  view: mockAppointmentDatesSetEvent.view,
};
