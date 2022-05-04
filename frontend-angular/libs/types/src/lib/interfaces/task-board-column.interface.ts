/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type { KanbanTask } from './task.interface';

export interface TaskBoardColumn {
  color?: string;
  content_type?: number;
  content_type_model?: string;
  display?: string;
  icon: string;
  ordering: number;
  pk?: string;
  title: string;
  // Custom
  tasks?: KanbanTask[];
}
