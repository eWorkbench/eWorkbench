/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { mockUser } from '@eworkbench/mocks';
import type { Directory } from '@eworkbench/types';

export const mockDirectory: Directory = {
  content_type: 49,
  is_virtual_root: true,
  created_by: mockUser,
  last_modified_at: '2019-04-18T13:17:43.403709+02:00',
  imported: false,
  url: 'http://localhost:8000/api/drives/c6159dec-d393-4520-95ab-24c7d5941e4c/sub_directories/9c166a32-6b0c-4317-ac65-9f1ae7799a99/',
  display: '/',
  drive_id: 'c6159dec-d393-4520-95ab-24c7d5941e4c',
  download_directory:
    'http://localhost:8000/api/drives/c6159dec-d393-4520-95ab-24c7d5941e4c/sub_directories/9c166a32-6b0c-4317-ac65-9f1ae7799a99/download/?jwt=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJwYXRoIjoiL2FwaS9kcml2ZXMvYzYxNTlkZWMtZDM5My00NTIwLTk1YWItMjRjN2Q1OTQxZTRjL3N1Yl9kaXJlY3Rvcmllcy85YzE2NmEzMi02YjBjLTQzMTctYWM2NS05ZjFhZTc3OTlhOTkvZG93bmxvYWQvIiwidXNlciI6MTU2LCJqd3RfdmVyaWZpY2F0aW9uX3Rva2VuIjoiNTA0MjY1Y2ZiMGNmNGJkNjhjZjY1MTBjZWE3ZWE3NmMiLCJleHAiOjE2MTQxODI1MjF9.VseeybsIFYYl2JuEP8Lsuo8Xn-uI1Vv4vSPXqhop864',
  pk: '9c166a32-6b0c-4317-ac65-9f1ae7799a99',
  content_type_model: 'drives.directory',
  directory: null,
  last_modified_by: mockUser,
  name: '/',
  created_at: '2019-04-18T13:17:43.403668+02:00',
};
