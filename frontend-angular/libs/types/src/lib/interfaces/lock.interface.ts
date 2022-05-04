/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type { User } from './user.interface';

export interface Lock {
  locked: boolean;
  model_name: string;
  model_pk: string;
  lock_details?: {
    content_type: number;
    locked_at: string;
    locked_by: User;
    locked_until: string;
    object_id: string;
    pk: string;
  };
}
