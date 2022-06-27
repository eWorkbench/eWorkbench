/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type { TemplateRef } from '@angular/core';
import type { TableSortDirection } from '../enums/table-sort-direction.enum';

export interface TableColumn {
  cellTemplate?: TemplateRef<any>;
  name: string;
  key: string;
  sortable?: boolean;
  sort?: TableSortDirection;
  hideable?: boolean;
  hidden?: boolean;
  width?: string;
}
