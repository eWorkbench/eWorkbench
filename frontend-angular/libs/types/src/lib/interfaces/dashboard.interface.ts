/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Contact } from './contact.interface';
import { DMP } from './dmp.interface';
import { File } from './file.interface';
import { Project } from './project.interface';
import { Resource } from './resource.interface';
import { KanbanTask } from './task.interface';

export interface DashboardSummary {
  contacts: number;
  dmps: number;
  drives: number;
  files: number;
  kanbanboards: number;
  labbooks: number;
  appointments: number;
  notes: number;
  projects: number;
  resources: number;
  tasks: number;
}

export interface Dashboard {
  contacts: Contact[];
  dmps: DMP[];
  files: File[];
  projects: Project[];
  resources: Resource[];
  tasks: KanbanTask[];
  summary: DashboardSummary;
}
