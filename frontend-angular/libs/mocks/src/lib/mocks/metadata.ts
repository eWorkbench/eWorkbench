/* istanbul ignore file */

/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Metadata, MetadataField, MetadataPayload, MetadataSearchRequestData, MetadataSearchResults } from '@eworkbench/types';
import { mockUser } from './user';

export const mockMetadataPayload: MetadataPayload = {
  base_type: 'text',
  description: '',
  name: 'Integer',
  type_settings: {
    thousands_separator: true,
  },
};

export const mockMetadata: Metadata = {
  content_type: 59,
  content_type_model: 'metadata.metadata',
  display: '5ea5649a-6930-4554-b972-8235da883fbb',
  field: 'e22cf025-c10f-4097-aef7-d9ea9a802562',
  field_info: {
    base_type: 'selection',
    content_type: 60,
    content_type_model: 'metadata.metadatafield',
    created_at: '2019-05-28T13:55:27.801603+02:00',
    created_by: mockUser,
    description: 'test',
    display: 'Check-text',
    last_modified_at: '2019-06-18T09:57:24.704395+02:00',
    last_modified_by: mockUser,
    name: 'Check-text',
    pk: 'e22cf025-c10f-4097-aef7-d9ea9a802562',
    type_settings: {
      final: true,
      answers: ['Check me'],
      multiple_select: true,
    },
  },
  ordering: 1,
  pk: '5ea5649a-6930-4554-b972-8235da883fbb',
  values: {
    answers: [
      {
        answer: 'Check me',
        selected: true,
      },
    ],
  },
};

export const mockMetadataField: MetadataField = {
  name: 'Selection',
  base_type: 'selection',
  content_type: 60,
  display: 'Selection',
  description: 'Test',
  created_at: '2020-01-27T10:30:06.051316+01:00',
  created_by: mockUser,
  last_modified_by: mockUser,
  pk: '44f035e9-229d-48cd-86c3-8fbe1bcea00c',
  content_type_model: 'metadata.metadatafield',
  type_settings: {
    final: true,
    answers: ['A', 'B', 'C'],
    multiple_select: true,
  },
  last_modified_at: '2020-01-27T10:30:06.051372+01:00',
};

export const mockMetadataDecimalField: MetadataField = {
  base_type: 'decimal_number',
  combinationOperator: 'AND',
  content_type: 60,
  content_type_model: 'metadata.metadatafield',
  created_at: '2019-05-15T09:42:59.226184+02:00',
  created_by: {
    pk: 150,
    username: 'testuser',
    email: 'testuser@domain.com',
    is_active: true,
    is_staff: true,
    last_login: '2020-07-02T15:06:38.181948+02:00',
    userprofile: {
      first_name: 'Test',
      last_name: 'User',
      anonymized: false,
      academic_title: 'Test',
      additional_information: 'Something about me',
      country: 'Österreich',
      email_others: [],
      org_zug_mitarbeiter: [],
      org_zug_mitarbeiter_lang: ['Aff1edit', 'Aff1', '2', '3'],
      org_zug_student: [],
      org_zug_student_lang: ['AffS1', 'AffS2edit', '1', '3'],
      phone: '+43 123 45678963421',
      salutation: '',
      title_salutation: '',
      title_pre: '',
      title_post: '',
      type: 'u',
      avatar: '',
      website: '',
    },
  },
  description: 'if set to -1, the input accepts only integers',
  display: 'Decimal integer',
  last_modified_at: '2019-06-18T09:57:53.440035+02:00',
  last_modified_by: {
    pk: 150,
    username: 'testuser',
    email: 'testuser@domain.com',
    is_active: true,
    is_staff: true,
    last_login: '2020-07-02T15:06:38.181948+02:00',
    userprofile: {
      first_name: 'Test',
      last_name: 'User',
      anonymized: false,
      academic_title: 'Test',
      additional_information: 'Something about me',
      country: 'Österreich',
      email_others: [],
      org_zug_mitarbeiter: [],
      org_zug_mitarbeiter_lang: ['Aff1edit', 'Aff1', '2', '3'],
      org_zug_student: [],
      org_zug_student_lang: ['AffS1', 'AffS2edit', '1', '3'],
      phone: '+43 123 45678963421',
      salutation: '',
      title_salutation: '',
      title_pre: '',
      title_post: '',
      type: 'u',
      avatar: '',
      website: '',
    },
  },
  name: 'Decimal integer',
  operator: '=',
  pk: 'e85cd7a0-72b1-4563-9014-f703931cd19f',
  type_settings: {
    decimals: -1,
    thousands_separator: false,
  },
  values: {
    value: 0,
  },
};

export const mockMetadataSearchPayload: MetadataSearchRequestData = {
  content_type: null,
  parameters: [
    {
      parameter_index: 0,
      field: 'e85cd7a0-72b1-4563-9014-f703931cd19f',
      operator: '=',
      values: {
        value: 1,
      },
    },
  ],
};

export const mockMetadataSearchResults: MetadataSearchResults[] = [
  {
    created_by: mockUser,
    notes: '',
    url: '',
    content_type_model: 'shared_elements.contact',
    academic_title: 'Ing.',
    last_modified_at: '2020-07-22T14:49:58.984070+02:00',
    version_number: 32,
    created_at: '2020-05-27T10:41:14.770950+02:00',
    email: '',
    deleted: false,
    first_name: 'Max',
    projects: [],
    company: '',
    metadata: [
      {
        content_type_model: 'metadata.metadata',
        values: { value: 1 },
        content_type: 59,
        display: 'b1c7ac55-6a33-436a-a0bf-42d3bb8f2932',
        field: 'e85cd7a0-72b1-4563-9014-f703931cd19f',
        pk: 'b1c7ac55-6a33-436a-a0bf-42d3bb8f2932',
      },
    ],
    phone: '',
    content_type: 27,
    display: 'Ing. Max Mustermann',
    last_modified_by: mockUser,
    pk: 'e614c989-d27a-4c6a-ab20-93ba5cf58825',
    last_name: 'Mustermann',
  },
];
