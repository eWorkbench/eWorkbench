import { Injectable } from '@angular/core';
import type { MenuModelItem, MenuModels } from '@eworkbench/types';
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
        name: this.translocoService.translate('menu.dashboard'),
        routerLink: '/',
        routerLinkExactMatch: true,
      },
      'menu.labbooks': {
        modelName: 'labbooks',
        name: this.translocoService.translate('menu.labbooks'),
        routerLink: '/labbooks',
        routerLinkExactMatch: false,
      },
      'menu.tasks': {
        modelName: 'tasks',
        name: this.translocoService.translate('menu.tasks'),
        routerLink: '/tasks',
        routerLinkExactMatch: false,
      },
      'menu.taskboards': {
        modelName: 'taskboards',
        name: this.translocoService.translate('menu.taskboards'),
        routerLink: '/taskboards',
        routerLinkExactMatch: false,
      },
      'menu.projects': {
        modelName: 'projects',
        name: this.translocoService.translate('menu.projects'),
        routerLink: '/projects',
        routerLinkExactMatch: false,
      },
      'menu.contacts': {
        modelName: 'contacts',
        name: this.translocoService.translate('menu.contacts'),
        routerLink: '/contacts',
        routerLinkExactMatch: false,
      },
      'menu.calendar': {
        modelName: 'calendar',
        name: this.translocoService.translate('menu.calendar'),
        routerLink: '/calendar',
        routerLinkExactMatch: false,
      },
      'menu.appointments': {
        modelName: 'appointments',
        name: this.translocoService.translate('menu.appointments'),
        routerLink: '/appointments',
        routerLinkExactMatch: false,
      },
      'menu.pictures': {
        modelName: 'pictures',
        name: this.translocoService.translate('menu.pictures'),
        routerLink: '/pictures',
        routerLinkExactMatch: false,
      },
      'menu.storages': {
        modelName: 'storages',
        name: this.translocoService.translate('menu.storages'),
        routerLink: '/storages',
        routerLinkExactMatch: false,
      },
      'menu.files': {
        modelName: 'files',
        name: this.translocoService.translate('menu.files'),
        routerLink: '/files',
        routerLinkExactMatch: false,
      },
      'menu.resources': {
        modelName: 'resources',
        name: this.translocoService.translate('menu.resources'),
        routerLink: '/resources',
        routerLinkExactMatch: false,
      },
      'menu.dmps': {
        modelName: 'dmp',
        name: this.translocoService.translate('menu.dmps'),
        routerLink: '/dmps',
        routerLinkExactMatch: false,
      },
      'menu.plugin-data': {
        modelName: 'plugin-data',
        name: this.translocoService.translate('menu.pluginData'),
        routerLink: '/plugin-data',
        routerLinkExactMatch: false,
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
