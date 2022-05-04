/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type { User } from './user.interface';

export interface DirectoryPayload {
  name: string;
  directory: string;
}

export interface Directory {
  content_type: number;
  content_type_model: string;
  created_at: string;
  created_by: User;
  directory: string | null;
  display: string;
  download_directory: string;
  drive_id: string;
  imported: boolean;
  is_virtual_root: boolean;
  last_modified_at: string;
  last_modified_by: User;
  name: string;
  pk: string;
  url: string;
}
