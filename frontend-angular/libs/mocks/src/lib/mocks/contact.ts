/* istanbul ignore file */

/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Contact, ContactPayload, DjangoAPI, RecentChanges, Version } from '@eworkbench/types';
import { mockUser } from './user';

export const mockContactPayload: ContactPayload = {
  academic_title: 'Mr.',
  first_name: 'Test',
  last_name: 'User',
  email: 'test@user.com',
  phone: '+43 1 234567890',
  company: '',
  notes: '',
  projects: [],
};

export const mockContact: Contact = {
  academic_title: 'Mr.',
  company: '',
  content_type: 27,
  content_type_model: 'shared_elements.contact',
  created_at: '2020-05-29T14:31:42.214163+02:00',
  created_by: mockUser,
  deleted: false,
  display: 'Mr. Test User',
  email: 'test@user.com',
  first_name: 'Test',
  last_modified_at: '2020-09-10T10:13:20.583640+02:00',
  last_modified_by: mockUser,
  last_name: 'User',
  metadata: [],
  notes: '<p>Test</p>',
  phone: '',
  pk: '17200f04-e862-4a67-938c-86739403984e',
  projects: ['415107a9-23e6-4f70-82b3-2fe5ea04eb3a'],
  url: 'http://workbench.local:8000/api/contacts/17200f04-e862-4a67-938c-86739403984e/',
  version_number: 64,
  is_favourite: false,
};

export const mockContactsList: DjangoAPI<Contact[]> = {
  count: 1,
  next: null,
  previous: null,
  results: [mockContact],
};

export const mockContactHistory: DjangoAPI<RecentChanges[]> = {
  count: 1,
  next: null,
  previous: null,
  results: [
    {
      pk: '5b8487ec-06e6-4c17-8138-50689a1c1b76',
      user: mockUser,
      object_type: {
        id: 27,
        app_label: 'shared_elements',
        model: 'contact',
      },
      object_uuid: '72fc4f33-f68f-494f-bb06-d03a1d13b35e',
      changeset_type: 'I',
      date: '2020-02-12T14:56:25.872400+01:00',
      change_records: [
        { field_name: 'academic_title', old_value: null, new_value: '' },
        { field_name: 'company', old_value: null, new_value: '' },
        { field_name: 'deleted', old_value: null, new_value: 'False' },
        { field_name: 'email', old_value: null, new_value: '' },
        { field_name: 'first_name', old_value: null, new_value: 'First' },
        { field_name: 'last_name', old_value: null, new_value: 'Last' },
        { field_name: 'metadata', old_value: null, new_value: '[]' },
        { field_name: 'phone', old_value: null, new_value: '' },
        { field_name: 'projects', old_value: null, new_value: '' },
      ],
    },
  ],
};

export const mockContactVersion: Version = {
  content_type_model: 'versions.version',
  last_modified_by: mockUser,
  created_at: '2020-07-07T11:37:17.355094+02:00',
  number: 1,
  object_id: '11646370-ae38-4ecb-808b-ea24b5dc2019',
  created_by: mockUser,
  metadata: {
    email: 'test@user.com',
    notes: 'Test notes',
    phone: '0123456789',
    company: 'Self employed e.U.',
    metadata: [],
    projects: ['21f5caf4-c7cc-4e65-8912-6ff1ae5a2478'],
    last_name: 'User',
    first_name: 'Test',
    academic_title: 'Ing.',
    metadata_version: 2,
  },
  pk: '9a858ef7-72ce-4a2b-b6a7-76f806772758',
  last_modified_at: '2020-07-07T11:37:17.355129+02:00',
  display: 'Version 1 of Ing. Test User',
  content_type: 58,
  summary: '',
  content_type_pk: 27,
};
