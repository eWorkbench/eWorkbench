import { Injectable } from '@angular/core';
import { MenuModelItem, MenuModels } from '@eworkbench/types';
import { TranslocoService } from '@ngneat/transloco';

@Injectable({
  providedIn: 'root',
})
export class MenuModelService {
  public readonly models: Record<MenuModels, MenuModelItem | null>;

  public constructor(private readonly translocoService: TranslocoService) {
    this.models = {
      'menu.dashboard': {
        modelName: 'dashboard',
        name: translocoService.translate('menu.dashboard'),
        routerLink: '/',
      },
      'menu.labbooks': {
        modelName: 'labbooks',
        name: translocoService.translate('menu.labbooks'),
        routerLink: '/labbooks',
      },
      'menu.tasks': {
        modelName: 'tasks',
        name: translocoService.translate('menu.tasks'),
        routerLink: '/tasks',
      },
      'menu.taskboards': {
        modelName: 'taskboards',
        name: translocoService.translate('menu.taskboards'),
        routerLink: '/taskboards',
      },
      'menu.projects': {
        modelName: 'projects',
        name: translocoService.translate('menu.projects'),
        routerLink: '/projects',
      },
      'menu.contacts': {
        modelName: 'contacts',
        name: translocoService.translate('menu.contacts'),
        routerLink: '/contacts',
      },
      'menu.calendar': {
        modelName: 'calendar',
        name: translocoService.translate('menu.calendar'),
        routerLink: '/calendar',
      },
      'menu.appointments': {
        modelName: 'appointments',
        name: translocoService.translate('menu.appointments'),
        routerLink: '/appointments',
      },
      'menu.pictures': {
        modelName: 'pictures',
        name: translocoService.translate('menu.pictures'),
        routerLink: '/pictures',
      },
      'menu.storages': {
        modelName: 'storages',
        name: translocoService.translate('menu.storages'),
        routerLink: '/storages',
      },
      'menu.files': {
        modelName: 'files',
        name: translocoService.translate('menu.files'),
        routerLink: '/files',
      },
      'menu.comments': {
        modelName: 'comments',
        name: translocoService.translate('menu.comments'),
        routerLink: '/comments',
      },
      'menu.resources': {
        modelName: 'resources',
        name: translocoService.translate('menu.resources'),
        routerLink: '/resources',
      },
      'menu.dmps': {
        modelName: 'dmp',
        name: translocoService.translate('menu.dmps'),
        routerLink: '/dmps',
      },
      'menu.plugin-data': {
        modelName: 'plugin-data',
        name: translocoService.translate('menu.pluginData'),
        routerLink: '/plugin-data',
      },
    };
  }

  public get(name: MenuModels): MenuModelItem | null {
    const modelName = this.models[name];
    if (modelName) {
      return modelName;
    }

    return null;
  }
}
