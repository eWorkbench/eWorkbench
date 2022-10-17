/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type { LabBookContainer } from './labbook.interface';
import type { Metadata } from './metadata.interface';
import type { User } from './user.interface';

export interface NotePayload {
  subject: string;
  content: string | null;
  projects?: string[];
  metadata?: Metadata[];
}

export interface Note {
  last_modified_at: string | null;
  content_type: number;
  last_modified_by: User;
  created_at: string | null;
  content_type_model: string;
  subject: string;
  metadata: Metadata[];
  version_number: number;
  projects: string[];
  display: string;
  content: string;
  url: string;
  deleted: boolean;
  created_by: User;
  pk: string;
  is_favourite: boolean;
  labbook_container: LabBookContainer | null;
}
