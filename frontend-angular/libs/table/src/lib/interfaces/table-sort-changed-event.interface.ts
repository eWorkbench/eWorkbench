/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type { TableSortDirection } from '../enums/table-sort-direction.enum';

export interface TableSortChangedEvent {
  key: string;
  direction: TableSortDirection;
}
