/* istanbul ignore file */

/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LeaveProjectGuard } from '@app/guards/leave-project/leave-project.guard';
import { MatomoGuard } from '@app/guards/matomo/matomo.guard';
import { PendingChangesGuard } from '@app/guards/pending-changes/pending-changes.guard';
import { AppointmentPageComponent } from '../appointments/components/appointment-page/appointment-page.component';
import { AppointmentsPageComponent } from '../appointments/components/appointments-page/appointments-page.component';
import { CalendarPageComponent } from '../calendar/components/calendar-page/calendar-page.component';
import { ContactPageComponent } from '../contacts/components/contact-page/contact-page.component';
import { ContactsPageComponent } from '../contacts/components/contacts-page/contacts-page.component';
import { DMPPageComponent } from '../dmps/components/dmp-page/dmp-page.component';
import { DMPsPageComponent } from '../dmps/components/dmps-page/dmps-page.component';
import { FilePageComponent } from '../files/components/file-page/file-page.component';
import { FilesPageComponent } from '../files/components/files-page/files-page.component';
import { LabBookPageComponent } from '../labbooks/components/labbook-page/labbook-page.component';
import { LabBooksPageComponent } from '../labbooks/components/labbooks-page/labbooks-page.component';
import { PicturePageComponent } from '../pictures/components/picture-page/picture-page.component';
import { PicturesPageComponent } from '../pictures/components/pictures-page/pictures-page.component';
import { ResourcePageComponent } from '../resources/components/resource-page/resource-page.component';
import { ResourcesPageComponent } from '../resources/components/resources-page/resources-page.component';
import { StoragePageComponent } from '../storages/components/storage-page/storage-page.component';
import { StoragesPageComponent } from '../storages/components/storages-page/storages-page.component';
import { TaskBoardPageComponent } from '../task-boards/components/task-board-page/task-board-page.component';
import { TaskBoardsPageComponent } from '../task-boards/components/task-boards-page/task-boards-page.component';
import { TaskPageComponent } from '../tasks/components/task-page/task-page.component';
import { TasksPageComponent } from '../tasks/components/tasks-page/tasks-page.component';
import { ProjectPageComponent } from './components/project-page/project-page.component';
import { ProjectsPageComponent } from './components/projects-page/projects-page.component';

const routes: Routes = [
  {
    path: '',
    component: ProjectsPageComponent,
  },
  {
    path: ':projectId',
    component: ProjectPageComponent,
    canActivate: [MatomoGuard],
    canDeactivate: [LeaveProjectGuard, PendingChangesGuard],
  },
  {
    path: ':projectId/tasks',
    component: TasksPageComponent,
    canActivate: [MatomoGuard],
    canDeactivate: [LeaveProjectGuard],
  },
  {
    path: ':projectId/tasks/:id',
    component: TaskPageComponent,
    canActivate: [MatomoGuard],
    canDeactivate: [LeaveProjectGuard],
  },
  {
    path: ':projectId/taskboards',
    component: TaskBoardsPageComponent,
    canActivate: [MatomoGuard],
    canDeactivate: [LeaveProjectGuard],
  },
  {
    path: ':projectId/taskboards/:id',
    component: TaskBoardPageComponent,
    canActivate: [MatomoGuard],
    canDeactivate: [LeaveProjectGuard],
  },
  {
    path: ':projectId/contacts',
    component: ContactsPageComponent,
    canActivate: [MatomoGuard],
    canDeactivate: [LeaveProjectGuard],
  },
  {
    path: ':projectId/contacts/:id',
    component: ContactPageComponent,
    canActivate: [MatomoGuard],
    canDeactivate: [LeaveProjectGuard],
  },
  {
    path: ':projectId/calendar',
    component: CalendarPageComponent,
    canActivate: [MatomoGuard],
    canDeactivate: [LeaveProjectGuard],
  },
  {
    path: ':projectId/appointments',
    component: AppointmentsPageComponent,
    canActivate: [MatomoGuard],
    canDeactivate: [LeaveProjectGuard],
  },
  {
    path: ':projectId/appointments/:id',
    component: AppointmentPageComponent,
    canActivate: [MatomoGuard],
    canDeactivate: [LeaveProjectGuard],
  },
  {
    path: ':projectId/resources',
    component: ResourcesPageComponent,
    canActivate: [MatomoGuard],
    canDeactivate: [LeaveProjectGuard],
  },
  {
    path: ':projectId/resources/:id',
    component: ResourcePageComponent,
    canActivate: [MatomoGuard],
    canDeactivate: [LeaveProjectGuard],
  },
  {
    path: ':projectId/labbooks',
    component: LabBooksPageComponent,
    canActivate: [MatomoGuard],
    canDeactivate: [LeaveProjectGuard],
  },
  {
    path: ':projectId/labbooks/:id',
    component: LabBookPageComponent,
    canActivate: [MatomoGuard],
    canDeactivate: [LeaveProjectGuard],
  },
  {
    path: ':projectId/files',
    component: FilesPageComponent,
    canActivate: [MatomoGuard],
    canDeactivate: [LeaveProjectGuard],
  },
  {
    path: ':projectId/files/:id',
    component: FilePageComponent,
    canActivate: [MatomoGuard],
    canDeactivate: [LeaveProjectGuard],
  },
  {
    path: ':projectId/pictures',
    component: PicturesPageComponent,
    canActivate: [MatomoGuard],
    canDeactivate: [LeaveProjectGuard],
  },
  {
    path: ':projectId/pictures/:id',
    component: PicturePageComponent,
    canActivate: [MatomoGuard],
    canDeactivate: [LeaveProjectGuard],
  },
  {
    path: ':projectId/storages',
    component: StoragesPageComponent,
    canActivate: [MatomoGuard],
    canDeactivate: [LeaveProjectGuard],
  },
  {
    path: ':projectId/storages/:id',
    component: StoragePageComponent,
    canActivate: [MatomoGuard],
    canDeactivate: [LeaveProjectGuard],
  },
  {
    path: ':projectId/dmps',
    component: DMPsPageComponent,
    canActivate: [MatomoGuard],
    canDeactivate: [LeaveProjectGuard],
  },
  {
    path: ':projectId/dmps/:id',
    component: DMPPageComponent,
    canActivate: [MatomoGuard],
    canDeactivate: [LeaveProjectGuard],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ProjectsPageRoutingModule {}
