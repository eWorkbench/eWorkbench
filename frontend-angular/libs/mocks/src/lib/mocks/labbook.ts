/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type { DjangoAPI, LabBook, LabBookElement, LabBookPayload, Note, PluginInstance, RecentChanges, Version } from '@eworkbench/types';
import { mockNote } from './note';
import { mockPluginInstance } from './plugin';
import { mockUser } from './user';

export const mockLabBookPayload: LabBookPayload = {
  title: 'Test',
  projects: [],
  description: 'Description',
  is_template: false,
};

export const mockLabBook: LabBook = {
  display: 'Neues LabBook',
  pk: 'ec3a73fc-250a-40a2-a94b-f7262e7a95d7',
  description: '',
  metadata: [],
  content_type_model: 'labbooks.labbook',
  is_template: false,
  projects: [],
  url: 'http://workbench.local:8000/api/labbooks/ec3a73fc-250a-40a2-a94b-f7262e7a95d7/',
  last_modified_at: '2020-07-09T13:24:40.317191+02:00',
  created_at: '2020-07-09T13:24:40.317147+02:00',
  version_number: 0,
  last_modified_by: mockUser,
  created_by: mockUser,
  title: 'Neues LabBook',
  deleted: false,
  content_type: 41,
  is_favourite: false,
};

export const mockLabBooksList: DjangoAPI<LabBook[]> = {
  count: 1,
  next: null,
  previous: null,
  results: [mockLabBook],
};

export const mockLabBookNoteElement: LabBookElement<Note> = {
  child_object: mockNote,
  child_object_content_type: 28,
  child_object_content_type_model: 'shared_elements.note',
  child_object_id: 'f6684fee-9037-4a26-9e3c-309f75338a9f',
  content_type: 42,
  content_type_model: 'labbooks.labbookchildelement',
  display: 'Child Element at position 0,1',
  height: 7,
  lab_book_id: '91e3368b-8046-4515-970d-1332a73aa4d4',
  num_related_comments: 0,
  num_relations: 0,
  pk: '1f68ee4b-5d8f-4279-aab0-094024fa451d',
  position_x: 0,
  position_y: 1,
  width: 20,
};

export const mockLabBookPluginInstanceElement: LabBookElement<PluginInstance> = {
  child_object: mockPluginInstance,
  position_y: 0,
  display: 'Child Element at position 0,0',
  child_object_content_type_model: 'plugins.plugininstance',
  pk: 'a0de6956-a1f6-4238-87d0-5a5e1fc8554c',
  position_x: 0,
  height: 7,
  child_object_content_type: 80,
  content_type_model: 'labbooks.labbookchildelement',
  content_type: 42,
  num_related_comments: 0,
  width: 20,
  child_object_id: 'aba29d0a-008a-4eb8-b1c0-4c9671fd36c8',
  lab_book_id: '2c37da75-9100-4748-8045-ea2e55ef4759',
  num_relations: 0,
};

export const mockLabBookHistory: DjangoAPI<RecentChanges[]> = {
  count: 1,
  next: null,
  previous: null,
  results: [
    {
      pk: 'fd5861f9-cd6b-4145-b7bc-89e677b27b41',
      user: mockUser,
      object_type: { id: 41, app_label: 'labbooks', model: 'labbook' },
      object_uuid: '91e3368b-8046-4515-970d-1332a73aa4d4',
      changeset_type: 'I',
      date: '2020-06-17T09:50:05.922503+02:00',
      change_records: [
        { field_name: 'child_elements', old_value: null, new_value: '[]' },
        { field_name: 'deleted', old_value: null, new_value: 'False' },
        { field_name: 'description', old_value: null, new_value: 'Test from Angular 2' },
        { field_name: 'is_template', old_value: null, new_value: 'False' },
        { field_name: 'metadata', old_value: null, new_value: '[]' },
        { field_name: 'projects', old_value: null, new_value: '' },
        { field_name: 'title', old_value: null, new_value: 'Test LabBook' },
      ],
    },
  ],
};

export const mockLabBookVersion: Version = {
  content_type_model: 'versions.version',
  last_modified_by: mockUser,
  created_at: '2020-07-07T11:33:20.560496+02:00',
  number: 1,
  object_id: '91e3368b-8046-4515-970d-1332a73aa4d4',
  created_by: mockUser,
  metadata: {
    title: 'Test LabBook',
    metadata: [],
    projects: [],
    description: 'Test from Angular 2',
    is_template: false,
    child_elements: [],
    metadata_version: 1,
  },
  pk: '64896e48-27a7-49b9-b620-78129e0198fb',
  last_modified_at: '2020-07-07T11:33:20.560535+02:00',
  display: 'Version 1 of Test LabBook',
  content_type: 58,
  summary: '',
  content_type_pk: 41,
};
