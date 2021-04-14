/* istanbul ignore file */

/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { NotesPageComponent } from './components/notes-page/notes-page.component';
import { NotePageComponent } from './components/note-page/note-page.component';
import { PendingChangesGuard } from '@app/guards/pending-changes/pending-changes.guard';
import { MatomoGuard } from '@app/guards/matomo/matomo.guard';

const routes: Routes = [
  {
    path: '',
    component: NotesPageComponent,
  },
  {
    path: ':id',
    component: NotePageComponent,
    canActivate: [MatomoGuard],
    canDeactivate: [PendingChangesGuard],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class NotesPageRoutingModule {}
