/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { TableColumn } from './table-column.interface';

export type TableColumnChangedEvent = Omit<TableColumn, 'cellTemplate'>[];
