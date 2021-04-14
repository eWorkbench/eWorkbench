/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { DMPFormData } from './dmp.interface';
import { User } from './user.interface';

// TODO: Version interfaces differ. Maybe <any> would be better in this case.
export interface Version {
  content_type?: number;
  content_type_model?: string;
  content_type_pk?: number;
  created_at?: string;
  created_by?: User;
  display?: string;
  last_modified_at?: string;
  last_modified_by?: User;
  metadata: any;
  number?: number;
  version_number?: number;
  object_id?: string;
  pk?: string;
  summary?: string;
  dmp_form_title?: string;
  dmp_form_data?: DMPFormData[];
  deleted?: boolean;
  title?: string;
  projects?: string[];
  status?: string;
  url?: string;
  dmp_form?: string;
}

export interface FinalizeVersion {
  summary: string;
}
