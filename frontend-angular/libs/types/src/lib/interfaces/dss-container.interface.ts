/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Envelope } from './envelope.interface';
import { User } from './user.interface';

export interface DssContainerPayload {
  name: string;
  path: string;
  read_write_setting: 'RO' | 'RWNN' | 'RWON' | 'RWA';
  import_option: 'ION' | 'IL' | 'IA';
}

export interface DssContainer {
  content_type: number;
  content_type_model: string;
  created_at: string | null;
  created_by: User;
  deleted: boolean;
  display: string;
  envelopes: Envelope[];
  import_option: 'ION' | 'IL' | 'IA';
  is_mounted: boolean;
  last_modified_at: string | null;
  last_modified_by: User;
  name: string;
  path: string;
  pk: string;
  projects: string[];
  read_write_setting: 'RO' | 'RWNN' | 'RWON' | 'RWA';
  url: string;
}
