/* istanbul ignore file */

/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { mockUser } from '@eworkbench/mocks';
import { Drive } from '@eworkbench/types';
import { mockDirectory } from './directory';

export const mockDrive: Drive = {
  version_number: 22,
  content_type: 50,
  created_by: mockUser,
  is_dss_drive: false,
  metadata: [],
  webdav_url: 'http://workbench.local:8000/webdav/d/MyStorage%20(a95db858-e215-4d0d-a83d-857d565b53d6)/',
  location: '',
  sub_directories_url: 'http://workbench.local:8000/api/drives/a95db858-e215-4d0d-a83d-857d565b53d6/sub_directories/',
  deleted: false,
  last_modified_at: '2021-02-24T12:19:45.251070+01:00',
  envelope_path: null,
  dss_envelope_id: null,
  created_at: '2019-02-27T15:09:33.951330+01:00',
  imported: false,
  container_id: null,
  url: 'http://workbench.local:8000/api/drives/a95db858-e215-4d0d-a83d-857d565b53d6/',
  title: 'MyStorage',
  sub_directories: [mockDirectory],
  content_type_model: 'drives.drive',
  projects: ['21f5caf4-c7cc-4e65-8912-6ff1ae5a2478'],
  display: 'MyStorage',
  pk: 'a95db858-e215-4d0d-a83d-857d565b53d6',
  last_modified_by: mockUser,
  is_favourite: false,
};
