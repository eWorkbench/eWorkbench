/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type { Contact } from './contact.interface';
import type { DMP } from './dmp.interface';
import type { File } from './file.interface';
import type { Project } from './project.interface';
import type { Resource } from './resource.interface';
import type { KanbanTask } from './task.interface';

export interface Dashboard {
  contacts: Contact[];
  dmps: DMP[];
  files: File[];
  projects: Project[];
  resources: Resource[];
  tasks: KanbanTask[];
}
