/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export type ProjectSidebarModels =
  | 'sidebar.overview'
  | 'sidebar.tasks'
  | 'sidebar.taskboards'
  | 'sidebar.contacts'
  | 'sidebar.calendar'
  | 'sidebar.appointments'
  | 'sidebar.resources'
  | 'sidebar.labbooks'
  | 'sidebar.files'
  | 'sidebar.pictures'
  | 'sidebar.storages'
  | 'sidebar.dmps';

export interface ProjectSidebarModelItem {
  modelName: string;
  icon: string;
  name: string;
  routerBaseLink: string;
}
