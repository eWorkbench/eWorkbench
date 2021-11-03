/* istanbul ignore file */

/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { mockDMP } from '@eworkbench/mocks';
import { Dashboard } from '@eworkbench/types';
import { mockContact } from './contact';
import { mockFile } from './file';
import { mockProject } from './project';
import { mockResource } from './resource';
import { mockKanbanTask } from './task';

export const mockDashboard: Dashboard = {
  contacts: [mockContact],
  dmps: [mockDMP],
  files: [mockFile],
  projects: [mockProject],
  resources: [mockResource],
  tasks: [mockKanbanTask],
};
