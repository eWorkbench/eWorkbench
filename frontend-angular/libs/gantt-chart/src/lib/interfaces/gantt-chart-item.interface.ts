/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type { Project } from 'libs/types/src/lib/interfaces/project.interface';

export interface GanttChartItem {
  name: string;
  startTime: string | null;
  endTime: string | null;
  object: Project;
}
