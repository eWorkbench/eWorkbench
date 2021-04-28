/* istanbul ignore file */

/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { mockUser } from '@eworkbench/mocks';
import { File } from '@eworkbench/types';

export const mockFile: File = {
  version_number: 4,
  content_type: 30,
  created_by: mockUser,
  metadata: [],
  location: '',
  deleted: false,
  last_modified_at: '2020-01-15T10:21:59.021913+01:00',
  name: 'ccitt_4.tif',
  created_at: '2019-10-08T18:50:55.547200+02:00',
  description: '',
  file_size: 69554,
  url: 'http://workbench.local:8000/api/files/fff1d25f-f41c-42e0-93fb-bfb83c3411a5/',
  container_id: null,
  title: 'TIFF file - bhagmann2 has no view access',
  mime_type: 'image/tiff',
  imported: false,
  content_type_model: 'shared_elements.file',
  directory_id: 'c82001c8-d78a-4364-a99b-40be1144b1be',
  original_filename: 'ccitt_4.tif',
  projects: ['21f5caf4-c7cc-4e65-8912-6ff1ae5a2478'],
  is_dss_file: false,
  download: 'http://workbench.local:8000/api/files/1128c316-d046-4a8a-9553-2c0e70f6927d/download/',
  envelope_id: null,
  display: 'ccitt_4.tif',
  pk: 'fff1d25f-f41c-42e0-93fb-bfb83c3411a5',
  last_modified_by: mockUser,
  is_favourite: false,
};
