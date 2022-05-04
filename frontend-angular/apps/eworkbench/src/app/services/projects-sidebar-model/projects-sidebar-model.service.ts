/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Injectable } from '@angular/core';
import type { ProjectSidebarModelItem, ProjectSidebarModels } from '@eworkbench/types';

@Injectable({
  providedIn: 'root',
})
export class ProjectsSidebarModelService {
  public readonly models: Record<ProjectSidebarModels, ProjectSidebarModelItem | null>;

  public constructor() {
    this.models = {
      'sidebar.overview': {
        modelName: 'overview',
        icon: 'wb-overview',
        name: 'Details',
        routerBaseLink: '',
      },
      'sidebar.tasks': {
        modelName: 'tasks',
        icon: 'wb-tasks',
        name: 'Tasks',
        routerBaseLink: '/tasks',
      },
      'sidebar.taskboards': {
        modelName: 'taskboards',
        icon: 'wb-taskboards',
        name: 'Task Boards',
        routerBaseLink: '/taskboards',
      },
      'sidebar.contacts': {
        modelName: 'contacts',
        icon: 'wb-contacts',
        name: 'Contacts',
        routerBaseLink: '/contacts',
      },
      'sidebar.calendar': {
        modelName: 'calendar',
        icon: 'wb-calendar',
        name: 'Calendar',
        routerBaseLink: '/calendar',
      },
      'sidebar.appointments': {
        modelName: 'appointments',
        icon: 'wb-appointments',
        name: 'Appointments',
        routerBaseLink: '/appointments',
      },
      'sidebar.resources': {
        modelName: 'resources',
        icon: 'wb-resources',
        name: 'Resources',
        routerBaseLink: '/resources',
      },
      'sidebar.labbooks': {
        modelName: 'labbooks',
        icon: 'wb-lab-book',
        name: 'LabBooks',
        routerBaseLink: '/labbooks',
      },
      'sidebar.files': {
        modelName: 'files',
        icon: 'wb-files',
        name: 'Files',
        routerBaseLink: '/files',
      },
      'sidebar.pictures': {
        modelName: 'pictures',
        icon: 'wb-image',
        name: 'Pictures',
        routerBaseLink: '/pictures',
      },
      'sidebar.storages': {
        modelName: 'storages',
        icon: 'wb-storages',
        name: 'Storages',
        routerBaseLink: '/storages',
      },
      'sidebar.dmps': {
        modelName: 'dmps',
        icon: 'wb-dmps',
        name: 'DMPs',
        routerBaseLink: '/dmps',
      },
    };
  }

  public get(name: ProjectSidebarModels): ProjectSidebarModelItem | null {
    const modelName = this.models[name];
    if (modelName) {
      return modelName;
    }

    return null;
  }
}
