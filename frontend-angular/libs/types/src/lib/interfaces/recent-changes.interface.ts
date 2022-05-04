/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type { User } from './user.interface';

export interface RecentChangesChangeRecord {
  field_name: string;
  new_value: string | null;
  old_value: string | null;
}

export interface RecentChangesObjectType {
  app_label: string;
  id: number;
  model: string;
}

export interface RecentChanges {
  change_records: RecentChangesChangeRecord[];
  changeset_type: string;
  date: string;
  object_type: RecentChangesObjectType;
  object_uuid: string;
  pk?: string;
  user?: User;
  expanded?: boolean;
}
