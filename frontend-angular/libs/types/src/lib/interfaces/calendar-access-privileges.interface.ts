/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { User } from './user.interface';

export interface CalendarAccessPrivilegesPayload {
  content_type: number;
  content_type_model: string;
}

export interface CalendarAccessPrivileges {
  content_type: number;
  content_type_model: string;
  created_at: string | null;
  created_by: User;
  deleted: boolean;
  display: string;
  last_modified_at: string | null;
  last_modified_by: User;
  pk: string;
}
