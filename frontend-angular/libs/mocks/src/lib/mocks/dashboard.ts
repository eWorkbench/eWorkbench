/* istanbul ignore file */

/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Dashboard } from '@eworkbench/types';
import { mockContact } from './contact';
import { mockFile } from './file';
import { mockProject } from './project';
import { mockResource } from './resource';
import { mockKanbanTask } from './task';

export const mockDashboard: Dashboard = {
  contacts: [mockContact],
  dmps: [], // TODO: Fill this with a mock when DMPs have been implemented
  files: [mockFile],
  projects: [mockProject],
  resources: [mockResource],
  tasks: [mockKanbanTask],
  summary: {
    contacts: 1,
    dmps: 0,
    drives: 0,
    files: 1,
    kanbanboards: 1,
    labbooks: 0,
    appointments: 0,
    notes: 0,
    projects: 1,
    resources: 1,
    tasks: 1,
  },
};
