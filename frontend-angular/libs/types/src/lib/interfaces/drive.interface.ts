/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Directory } from './directory.interface';
import { Metadata } from './metadata.interface';
import { User } from './user.interface';

export interface DrivePayload {
  title: string;
  projects: string[];
  dss_envelope_id?: string | null;
  metadata?: Metadata[];
}

export interface Drive {
  container_id: string | null;
  content_type: number;
  content_type_model: string;
  created_at: string;
  created_by: User;
  deleted: boolean;
  display: string;
  dss_envelope_id: string | null;
  envelope_path: string | null;
  imported: boolean;
  is_dss_drive: boolean;
  last_modified_at: string;
  last_modified_by: User;
  location: string;
  metadata: Metadata[];
  pk: string;
  projects: string[];
  sub_directories: Directory[];
  sub_directories_url: string;
  title: string;
  url: string;
  version_number: number;
  webdav_url: string;
  is_favourite: boolean;
}
