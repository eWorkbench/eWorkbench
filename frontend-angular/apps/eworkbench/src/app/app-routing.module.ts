/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './guards/auth/auth.guard';
import { MatomoGuard } from './guards/matomo/matomo.guard';

export const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./pages/dashboard/dashboard-page.module').then(m => m.DashboardPageModule),
    canActivate: [AuthGuard, MatomoGuard],
  },
  {
    path: 'tasks',
    loadChildren: () => import('./pages/tasks/tasks-page.module').then(m => m.TasksPageModule),
    canActivate: [AuthGuard, MatomoGuard],
  },
  {
    path: 'kanbanboards',
    redirectTo: '/taskboards',
  },
  {
    path: 'taskboards',
    loadChildren: () => import('./pages/task-boards/task-boards-page.module').then(m => m.TaskBoardsPageModule),
    canActivate: [AuthGuard, MatomoGuard],
  },
  {
    path: 'labbooks',
    loadChildren: () => import('./pages/labbooks/labbooks-page.module').then(m => m.LabBooksPageModule),
    canActivate: [AuthGuard, MatomoGuard],
  },
  {
    path: 'projects',
    loadChildren: () => import('./pages/projects/projects-page.module').then(m => m.ProjectsPageModule),
    canActivate: [AuthGuard, MatomoGuard],
  },
  {
    path: 'main-calendar',
    redirectTo: '/calendar',
  },
  {
    path: 'calendar',
    loadChildren: () => import('./pages/calendar/calendar-page.module').then(m => m.CalendarPageModule),
    canActivate: [AuthGuard, MatomoGuard],
  },
  {
    path: 'files',
    loadChildren: () => import('./pages/files/files-page.module').then(m => m.FilesPageModule),
    canActivate: [AuthGuard, MatomoGuard],
  },
  {
    path: 'pictures',
    loadChildren: () => import('./pages/pictures/pictures-page.module').then(m => m.PicturesPageModule),
    canActivate: [AuthGuard, MatomoGuard],
  },
  {
    path: 'meetings',
    redirectTo: '/appointments',
  },
  {
    path: 'appointments',
    loadChildren: () => import('./pages/appointments/appointments-page.module').then(m => m.AppointmentsPageModule),
    canActivate: [AuthGuard, MatomoGuard],
  },
  {
    path: 'contacts',
    loadChildren: () => import('./pages/contacts/contacts-page.module').then(m => m.ContactsPageModule),
    canActivate: [AuthGuard, MatomoGuard],
  },
  {
    path: 'comments',
    redirectTo: '/notes',
  },
  {
    path: 'notes',
    loadChildren: () => import('./pages/notes/notes-page.module').then(m => m.NotesPageModule),
    canActivate: [AuthGuard, MatomoGuard],
  },
  {
    path: 'resources',
    loadChildren: () => import('./pages/resources/resources-page.module').then(m => m.ResourcesPageModule),
    canActivate: [AuthGuard, MatomoGuard],
  },
  {
    path: 'drives',
    redirectTo: '/storages',
  },
  {
    path: 'storages',
    loadChildren: () => import('./pages/storages/storages-page.module').then(m => m.StoragesPageModule),
    canActivate: [AuthGuard, MatomoGuard],
  },
  {
    path: 'metadata-search',
    loadChildren: () => import('./pages/metadata-search/metadata-search-page.module').then(m => m.MetadataSearchPageModule),
    canActivate: [AuthGuard, MatomoGuard],
  },
  {
    path: 'notifications',
    loadChildren: () => import('./pages/notifications/notifications-page.module').then(m => m.NotificationsPageModule),
    canActivate: [AuthGuard, MatomoGuard],
  },
  {
    path: 'dsscontainers',
    loadChildren: () => import('./pages/dss-containers/dss-containers-page.module').then(m => m.DssContainersPageModule),
    canActivate: [AuthGuard, MatomoGuard],
  },
  {
    path: 'profile',
    loadChildren: () => import('./pages/profile/profile-page.module').then(m => m.ProfilePageModule),
    canActivate: [AuthGuard, MatomoGuard],
  },
  {
    path: 'plugin-data',
    loadChildren: () => import('./pages/plugins/plugins-page.module').then(m => m.PluginsPageModule),
    canActivate: [AuthGuard, MatomoGuard],
  },
  {
    path: 'dmps',
    loadChildren: () => import('./pages/dmps/dmps-page.module').then(m => m.DMPsPageModule),
    canActivate: [AuthGuard],
  },
  {
    path: 'study-room-booking',
    loadChildren: () => import('./pages/study-room-booking/study-room-booking-page.module').then(m => m.StudyRoomBookingPageModule),
    canActivate: [AuthGuard, MatomoGuard],
  },
  {
    path: 'login',
    loadChildren: () => import('./pages/login/login-page.module').then(m => m.LoginPageModule),
    canActivate: [MatomoGuard],
  },
  {
    path: 'forgot-password',
    loadChildren: () => import('./pages/forgot-password/forgot-password-page.module').then(m => m.ForgotPasswordPageModule),
    canActivate: [MatomoGuard],
  },
  {
    path: 'reset-password',
    loadChildren: () => import('./pages/reset-password/reset-password-page.module').then(m => m.ResetPasswordPageModule),
    canActivate: [MatomoGuard],
  },
  {
    path: 'contact',
    loadChildren: () => import('./pages/contact-form/contact-form-page.module').then(m => m.ContactFormPageModule),
    canActivate: [AuthGuard, MatomoGuard],
  },
  {
    path: 'faq',
    loadChildren: () => import('./pages/faq/faq-page.module').then(m => m.FAQPageModule),
    canActivate: [MatomoGuard],
  },
  {
    path: 'privacy-policy',
    loadChildren: () => import('./pages/privacy-policy/privacy-policy-page.module').then(m => m.PrivacyPolicyPageModule),
    canActivate: [MatomoGuard],
  },
  {
    path: 'accessibility',
    loadChildren: () => import('./pages/accessibility/accessibility-page.module').then(m => m.AccessibilityPageModule),
    canActivate: [MatomoGuard],
  },
  {
    path: 'imprint',
    loadChildren: () => import('./pages/imprint/imprint-page.module').then(m => m.ImprintPageModule),
    canActivate: [MatomoGuard],
  },
  {
    path: 'licenses',
    loadChildren: () => import('./pages/licenses/licenses-page.module').then(m => m.LicensesPageModule),
    canActivate: [MatomoGuard],
  },
  {
    path: '**',
    loadChildren: () => import('./pages/error/error-page.module').then(m => m.ErrorPageModule),
    canActivate: [MatomoGuard],
  },
];

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    RouterModule.forRoot(routes, {
      onSameUrlNavigation: 'reload',
      relativeLinkResolution: 'legacy',
    }),
  ],
  exports: [RouterModule],
})
/* istanbul ignore next */
export class AppRoutingModule {}
