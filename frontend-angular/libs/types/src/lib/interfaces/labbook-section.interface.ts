/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type { User } from './user.interface';

export interface LabBookSectionPayload {
  pk?: string;
  date?: string;
  title?: string;
  projects?: string[];
  child_elements?: string[];
}

export interface LabBookSection {
  child_elements: string[];
  content_type: number;
  content_type_model: string;
  created_at: string;
  created_by: User;
  date: string;
  deleted: boolean;
  display: string;
  last_modified_at: string;
  last_modified_by: User;
  pk: string;
  projects: string[];
  title: string;
  url: string;
  version_number: number;
}
