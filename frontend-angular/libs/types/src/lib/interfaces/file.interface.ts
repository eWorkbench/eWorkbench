/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type { Directory } from './directory.interface';
import type { Metadata } from './metadata.interface';
import type { User } from './user.interface';

export interface FilePayload {
  title: string;
  name: string;
  directory_id?: string | null;
  path: globalThis.File | string | null;
  description?: string;
  projects?: string[];
  metadata?: Metadata[];
}

export interface File {
  container_id: string | null;
  content_type: number;
  content_type_model: string;
  created_at: string;
  created_by: User;
  deleted: boolean;
  description: string;
  directory_id: string | null;
  directory?: Directory | null;
  display: string;
  download: string;
  envelope_id: string | null;
  file_size: number;
  icon_class?: string;
  imported: boolean;
  is_dss_file: boolean;
  last_modified_at: string;
  last_modified_by: User;
  location: string;
  metadata: Metadata[];
  mime_type: string;
  name: string;
  original_filename: string;
  pk: string;
  projects: string[];
  title: string;
  url: string;
  version_number: number;
  is_favourite: boolean;
}
