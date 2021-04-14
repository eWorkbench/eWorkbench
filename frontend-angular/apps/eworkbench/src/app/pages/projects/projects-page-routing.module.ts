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
import { AppointmentsPageComponent } from '../appointments/components/appointments-page/appointments-page.component';
import { CalendarPageComponent } from '../calendar/components/calendar-page/calendar-page.component';
import { ContactsPageComponent } from '../contacts/components/contacts-page/contacts-page.component';
import { DMPsPageComponent } from '../dmps/components/dmps-page/dmps-page.component';
import { FilesPageComponent } from '../files/components/files-page/files-page.component';
import { LabBooksPageComponent } from '../labbooks/components/labbooks-page/labbooks-page.component';
import { PicturesPageComponent } from '../pictures/components/pictures-page/pictures-page.component';
import { ResourcesPageComponent } from '../resources/components/resources-page/resources-page.component';
import { StoragesPageComponent } from '../storages/components/storages-page/storages-page.component';
import { TaskBoardsPageComponent } from '../task-boards/components/task-boards-page/task-boards-page.component';
import { TasksPageComponent } from '../tasks/components/tasks-page/tasks-page.component';
import { ProjectPageComponent } from './components/project-page/project-page.component';
import { ProjectsPageComponent } from './components/projects-page/projects-page.component';

const routes: Routes = [
  {
    path: '',
    component: ProjectsPageComponent,
  },
  {
    path: ':id',
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
    path: ':projectId/taskboards',
    component: TaskBoardsPageComponent,
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
    path: ':projectId/resources',
    component: ResourcesPageComponent,
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
    path: ':projectId/files',
    component: FilesPageComponent,
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
    path: ':projectId/storages',
    component: StoragesPageComponent,
    canActivate: [MatomoGuard],
    canDeactivate: [LeaveProjectGuard],
  },
  {
    path: ':projectId/dmps',
    component: DMPsPageComponent,
    canActivate: [MatomoGuard],
    canDeactivate: [LeaveProjectGuard],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ProjectsPageRoutingModule {}
