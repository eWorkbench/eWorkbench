/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Injectable } from '@angular/core';
import { ContentTypeModelItem, ContentTypeModels } from '@eworkbench/types';
import { TranslocoService } from '@ngneat/transloco';

@Injectable({
  providedIn: 'root',
})
export class ContentTypeModelService {
  private readonly models: Record<ContentTypeModels, ContentTypeModelItem | null>;

  public constructor(private readonly translocoService: TranslocoService) {
    this.models = {
      'dmp.dmp': {
        modelName: 'dmp',
        routerBaseLink: '/dmps',
        translation: this.translocoService.translate('dmp.singular'),
        translationPlural: this.translocoService.translate('dmp.plural'),
        icon: 'wb-dmps',
      },
      'labbooks.labbook': {
        modelName: 'labbook',
        routerBaseLink: '/labbooks',
        translation: this.translocoService.translate('labbook.singular'),
        translationPlural: this.translocoService.translate('labbook.plural'),
        icon: 'wb-lab-book',
      },
      'labbooks.labbooksection': {
        modelName: 'labbooksection',
        routerBaseLink: null,
        translation: this.translocoService.translate('labbooksection.singular'),
        translationPlural: this.translocoService.translate('labbooksection.plural'),
        icon: 'wb-bars',
      },
      'shared_elements.contact': {
        modelName: 'contact',
        routerBaseLink: '/contacts',
        translation: this.translocoService.translate('contact.singular'),
        translationPlural: this.translocoService.translate('contact.plural'),
        icon: 'wb-contacts',
      },
      'shared_elements.file': {
        modelName: 'file',
        routerBaseLink: '/files',
        translation: this.translocoService.translate('file.singular'),
        translationPlural: this.translocoService.translate('file.plural'),
        icon: 'wb-files',
      },
      'shared_elements.meeting': {
        modelName: 'meeting',
        routerBaseLink: '/appointments',
        translation: this.translocoService.translate('appointment.singular'),
        translationPlural: this.translocoService.translate('appointment.plural'),
        icon: 'wb-appointments',
      },
      'shared_elements.note': {
        modelName: 'note',
        routerBaseLink: '/comments',
        translation: this.translocoService.translate('comment.singular'),
        translationPlural: this.translocoService.translate('comment.plural'),
        icon: 'wb-comment',
      },
      'shared_elements.task': {
        modelName: 'task',
        routerBaseLink: '/tasks',
        translation: this.translocoService.translate('task.singular'),
        translationPlural: this.translocoService.translate('task.plural'),
        icon: 'wb-tasks',
      },
      'projects.project': {
        modelName: 'project',
        routerBaseLink: '/projects',
        translation: this.translocoService.translate('project.singular'),
        translationPlural: this.translocoService.translate('project.plural'),
        icon: 'wb-book-closed',
      },
      'projects.projectroleuserassignment': {
        modelName: 'projectroleuserassignment',
        routerBaseLink: null,
        translation: this.translocoService.translate('projectmember.singular'),
        translationPlural: this.translocoService.translate('projectmember.plural'),
        icon: 'wb-users',
      },
      'projects.resource': {
        modelName: 'resource',
        routerBaseLink: '/resources',
        translation: this.translocoService.translate('resource.singular'),
        translationPlural: this.translocoService.translate('resource.plural'),
        icon: 'wb-resources',
      },
      'pictures.picture': {
        modelName: 'picture',
        routerBaseLink: '/pictures',
        translation: this.translocoService.translate('picture.singular'),
        translationPlural: this.translocoService.translate('picture.plural'),
        icon: 'wb-image',
      },
      'plugins.plugininstance': {
        modelName: 'plugin',
        routerBaseLink: '/plugin-data',
        translation: this.translocoService.translate('plugin.singular'),
        translationPlural: this.translocoService.translate('plugin.plural'),
        icon: 'wb-storages',
      },
      'kanban_boards.kanbanboard': {
        modelName: 'kanbanboard',
        routerBaseLink: '/taskboards',
        translation: this.translocoService.translate('taskboard.singular'),
        translationPlural: this.translocoService.translate('taskboard.plural'),
        icon: 'wb-taskboards',
      },
      'drives.drive': {
        modelName: 'drive',
        routerBaseLink: '/storages',
        translation: this.translocoService.translate('storage.singular'),
        translationPlural: this.translocoService.translate('storage.plural'),
        icon: 'wb-storages',
      },
      'dss.dsscontainer': {
        modelName: 'dsscontainer',
        routerBaseLink: '/dsscontainers',
        translation: this.translocoService.translate('dss.singular'),
        translationPlural: this.translocoService.translate('dss.plural'),
        icon: 'wb-storages',
      },
    };
  }

  public get(name: ContentTypeModels, entity: keyof ContentTypeModelItem): string | null {
    const modelName = this.models[name];
    if (modelName) {
      return modelName[entity];
    }

    return null;
  }
}
