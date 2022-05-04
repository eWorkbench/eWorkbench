/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type { Metadata } from './metadata.interface';
import type { User } from './user.interface';

export interface DMPPayload {
  title: string;
  dmp_form?: string;
  status?: 'NEW' | 'PROG' | 'FIN';
  projects: string[];
  metadata?: Metadata[];
  dmp_form_data?: DMPFormData[];
}

export interface DMPForm {
  content_type: number;
  content_type_model: string;
  description: string;
  display: string;
  pk: string;
  title: string;
}

export interface DMPFormData {
  dmp: string;
  dmp_form_field: string;
  pk: string;
  content_type: number;
  ordering: number;
  content_type_model: string;
  name: string;
  infotext: string;
  url: string;
  display: string;
  value: string;
  type: string;
}

export interface DMP {
  created_at: string | null;
  dmp_form_title: string;
  pk: string;
  content_type: number;
  metadata: Metadata[];
  version_number: number;
  content_type_model: string;
  dmp_form_data: DMPFormData[];
  last_modified_at: string | null;
  deleted: boolean;
  title: string;
  projects: string[];
  status: 'NEW' | 'PROG' | 'FIN';
  created_by: User;
  url: string;
  last_modified_by: User;
  display: string;
  dmp_form: string;
  is_favourite: boolean;
}
