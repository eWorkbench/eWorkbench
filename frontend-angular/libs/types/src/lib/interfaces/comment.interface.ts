/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Metadata } from './metadata.interface';
import { User } from './user.interface';

export interface CommentPayload {
  content: string | null;
  projects?: string[];
  private?: boolean;
  relates_to_content_type_id?: number;
  relates_to_pk?: string;
  metadata?: Metadata[];
}

export interface Comment {
  last_modified_at: string | null;
  content_type: number;
  last_modified_by: User;
  created_at: string | null;
  content_type_model: string;
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
}
