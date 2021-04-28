/* istanbul ignore file */

/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { DjangoAPI, DMP, DMPForm, DMPFormData, DMPPayload, RecentChanges, Version } from '@eworkbench/types';
import { mockUser } from './user';

export const mockDMPPayload: DMPPayload = {
  dmp_form: '802eb7fa-49f4-443a-8e2f-f17e20979ef3',
  projects: ['21f5caf4-c7cc-4e65-8912-6ff1ae5a2478'],
  title: 'Test DMP',
};

export const mockDMPForm: DMPForm = {
  content_type: 38,
  content_type_model: 'dmp.dmpform',
  description: 'Bla bla blub',
  display: 'DMP Form MyDmpForm',
  pk: '802eb7fa-49f4-443a-8e2f-f17e20979ef3',
  title: 'MyDmpForm',
};

export const mockDMPFormData: DMPFormData = {
  dmp: 'fa70ff87-910b-4782-91a2-d11ae9cdc7ac',
  dmp_form_field: 'abd5707b-0af4-4fc9-85f3-702852688166',
  pk: 'f93040d3-5f92-48cd-a1f9-c6d718c335ba',
  content_type: 40,
  ordering: 1,
  content_type_model: 'dmp.dmpformdata',
  name: 'TextfieldField',
  infotext: '<p>asdfasdf</p>',
  url: 'http://workbench.local:8000/api/dmps/fa70ff87-910b-4782-91a2-d11ae9cdc7ac/data/f93040d3-5f92-48cd-a1f9-c6d718c335ba/',
  display: 'DMP Form Data TextfieldField (TXF)',
  value: '',
  type: 'TXF',
};

export const mockDMP: DMP = {
  created_at: '2019-06-26T12:14:23.435742+02:00',
  dmp_form_title: 'MyDmpForm',
  pk: 'fa70ff87-910b-4782-91a2-d11ae9cdc7ac',
  content_type: 37,
  metadata: [],
  version_number: 1,
  content_type_model: 'dmp.dmp',
  dmp_form_data: [mockDMPFormData],
  last_modified_at: '2019-07-03T11:03:27.953087+02:00',
  deleted: false,
  title: 'A DMP SORTING',
  projects: ['21f5caf4-c7cc-4e65-8912-6ff1ae5a2478'],
  status: 'PROG',
  created_by: mockUser,
  url: 'http://workbench.local:8000/api/dmps/fa70ff87-910b-4782-91a2-d11ae9cdc7ac/',
  last_modified_by: mockUser,
  display: 'A DMP SORTING',
  dmp_form: '802eb7fa-49f4-443a-8e2f-f17e20979ef3',
  is_favourite: false,
};

export const mockDMPsList: DjangoAPI<DMP[]> = {
  count: 1,
  next: null,
  previous: null,
  results: [mockDMP],
};

export const mockDMPHistory: DjangoAPI<RecentChanges[]> = {
  count: 1,
  next: null,
  previous: null,
  results: [
    {
      pk: '4eef26a1-e6cb-440e-b0fd-b3be68d3f11f',
      user: mockUser,
      object_type: { id: 37, app_label: 'dmp', model: 'dmp' },
      object_uuid: 'fa70ff87-910b-4782-91a2-d11ae9cdc7ac',
      changeset_type: 'I',
      date: '2019-06-26T12:14:23.457702+02:00',
      change_records: [
        { field_name: 'deleted', old_value: null, new_value: 'False' },
        { field_name: 'dmp_form', old_value: null, new_value: '802eb7fa-49f4-443a-8e2f-f17e20979ef3' },
        { field_name: 'dmp_form_data', old_value: null, new_value: '[]' },
        { field_name: 'metadata', old_value: null, new_value: '[]' },
        { field_name: 'projects', old_value: null, new_value: '' },
        { field_name: 'status', old_value: null, new_value: 'NEW' },
        { field_name: 'title', old_value: null, new_value: 'A DMP SORTING' },
      ],
    },
  ],
};

export const mockDMPVersion: Version = {
  created_at: '2021-04-07T12:46:09.367827+02:00',
  dmp_form_title: 'MyDmpForm',
  pk: 'ed1f4f29-655e-4791-9d80-41bf801ee39d',
  content_type: 37,
  metadata: [],
  version_number: 0,
  content_type_model: 'dmp.dmp',
  dmp_form_data: [mockDMPFormData],
  last_modified_at: '2021-04-07T12:46:09.367867+02:00',
  deleted: false,
  title: 'Test DMP',
  projects: ['21f5caf4-c7cc-4e65-8912-6ff1ae5a2478'],
  status: 'NEW',
  created_by: mockUser,
  url: 'http://workbench.local:8000/api/dmps/ed1f4f29-655e-4791-9d80-41bf801ee39d/',
  last_modified_by: mockUser,
  display: 'Test DMP',
  dmp_form: '802eb7fa-49f4-443a-8e2f-f17e20979ef3',
};
