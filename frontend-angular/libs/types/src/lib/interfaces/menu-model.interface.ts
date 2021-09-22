/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export type MenuModels =
  | 'menu.dashboard'
  | 'menu.appointments'
  | 'menu.calendar'
  | 'menu.contacts'
  | 'menu.files'
  | 'menu.labbooks'
  | 'menu.pictures'
  | 'menu.plugin-data'
  | 'menu.projects'
  | 'menu.resources'
  | 'menu.storages'
  | 'menu.taskboards'
  | 'menu.tasks'
  | 'menu.dmps';

export interface MenuModelItem {
  modelName: string;
  name: string;
  routerLink: string;
  routerLinkExactMatch: boolean;
}
