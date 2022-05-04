/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type { Metadata } from './metadata.interface';
import type { User } from './user.interface';

export interface ContactPayload {
  academic_title: string;
  created_for?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  company: string;
  notes?: string;
  projects: string[];
  metadata?: Metadata[];
}

export interface Contact {
  last_modified_at: string | null;
  academic_title: string;
  content_type: number;
  last_modified_by: User;
  created_at: string | null;
  content_type_model: string;
  last_name: string;
  first_name: string;
  metadata: Metadata[];
  version_number: number;
  notes: string;
  projects: string[];
  phone: string;
  display: string;
  url: string;
  deleted: boolean;
  company: string;
  email: string;
  created_by: User;
  pk: string;
  is_favourite: boolean;
}
