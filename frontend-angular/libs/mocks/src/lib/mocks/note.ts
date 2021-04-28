/* istanbul ignore file */

/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { DjangoAPI, Note, NotePayload, RecentChanges, Version } from '@eworkbench/types';
import { mockUser } from './user';

export const mockNotePayload: NotePayload = {
  subject: 'Test',
  content: null,
  projects: [],
};

export const mockNote: Note = {
  content_type_model: 'shared_elements.note',
  version_number: 11,
  last_modified_by: mockUser,
  created_at: '2019-10-25T10:17:47.511134+02:00',
  last_modified_at: '2019-10-25T10:43:14.398828+02:00',
  deleted: false,
  created_by: mockUser,
  projects: ['21f5caf4-c7cc-4e65-8912-6ff1ae5a2478'],
  subject: '43543543rerefgfd',
  pk: 'f65dc246-8528-4a40-9900-0ded103c088b',
  url: 'http://workbench.local:8000/api/notes/f65dc246-8528-4a40-9900-0ded103c088b/',
  display: '43543543rerefgfd',
  content: '<p>4543543retrefdgfd</p>',
  metadata: [],
  content_type: 28,
  is_favourite: false,
};

export const mockNotesList: DjangoAPI<Note[]> = {
  count: 1,
  next: null,
  previous: null,
  results: [mockNote],
};

export const mockNoteHistory: DjangoAPI<RecentChanges[]> = {
  count: 1,
  next: null,
  previous: null,
  results: [
    {
      pk: '7a20340e-b1ac-46b5-871c-48f30e4a3ecb',
      user: mockUser,
      object_type: { id: 28, app_label: 'shared_elements', model: 'note' },
      object_uuid: 'ea9636db-2020-4326-8191-47a14142ba42',
      changeset_type: 'I',
      date: '2020-07-06T14:15:48.534094+02:00',
      change_records: [
        { field_name: 'content', old_value: null, new_value: '' },
        { field_name: 'deleted', old_value: null, new_value: 'False' },
        { field_name: 'metadata', old_value: null, new_value: '[]' },
        { field_name: 'projects', old_value: null, new_value: '' },
        { field_name: 'subject', old_value: null, new_value: 'test' },
      ],
    },
  ],
};

export const mockNoteVersion: Version = {
  content_type_model: 'versions.version',
  last_modified_by: mockUser,
  created_at: '2020-07-07T11:39:26.466791+02:00',
  number: 1,
  object_id: 'f9bf90c4-d81d-4ad4-a28f-20bc5b1648f7',
  created_by: mockUser,
  metadata: { content: '', subject: 'Test Comment', metadata: [], projects: [], metadata_version: 1 },
  pk: '5e0eb063-a3c2-41a5-abbd-541c0c64ebb5',
  last_modified_at: '2020-07-07T11:39:26.466824+02:00',
  display: 'Version 1 of Test Comment',
  content_type: 58,
  summary: '',
  content_type_pk: 28,
};
