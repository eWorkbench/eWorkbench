/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type { User } from '@eworkbench/types';

export interface SearchResult {
  content_type_model: string;
  display: string;
  created_by: User;
}
