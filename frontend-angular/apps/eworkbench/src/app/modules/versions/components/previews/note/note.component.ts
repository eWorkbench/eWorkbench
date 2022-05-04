/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ModalState } from '@app/enums/modal-state.enum';
import { NotesService, ProjectsService } from '@app/services';
import type { ModalCallback, Note, Project } from '@eworkbench/types';
import { DialogRef } from '@ngneat/dialog';
import { FormBuilder } from '@ngneat/reactive-forms';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ToastrService } from 'ngx-toastr';

@UntilDestroy()
@Component({
  selector: 'eworkbench-note-preview',
  templateUrl: './note.component.html',
  styleUrls: ['./note.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotePreviewComponent implements OnInit {
  @Input()
  public id?: string;

  @Input()
  public version?: string;

  @Input()
  public versionInProgress?: number | null;

  @Input()
  public modalRef!: DialogRef;

  @Output()
  public closed = new EventEmitter<ModalCallback>();

  public state = ModalState.Unchanged;

  public note?: Note;

  public contentFormControl = this.fb.control<string | null>(null);

  public projectsFormControl = this.fb.control<string[] | null>(null);

  public projects: Project[] = [];

  public loading = true;

  public constructor(
    private readonly toastrService: ToastrService,
    private readonly translocoService: TranslocoService,
    private readonly notesService: NotesService,
    private readonly projectsService: ProjectsService,
    private readonly fb: FormBuilder,
    private readonly cdr: ChangeDetectorRef
  ) {}

  public ngOnInit(): void {
    this.initDetails();
  }

  public initDetails(): void {
    this.notesService
      .previewVersion(this.id!, this.version!)
      .pipe(untilDestroyed(this))
      .subscribe(
        (note: Note) => {
          this.note = { ...note };

          this.contentFormControl.patchValue(note.content, { emitEvent: false });
          this.contentFormControl.disable({ emitEvent: false });

          this.loadProjects(note.projects);
          this.projectsFormControl.patchValue(note.projects, { emitEvent: false });
          this.projectsFormControl.disable({ emitEvent: false });

          this.loading = false;
          this.cdr.markForCheck();
        },
        () => {
          this.loading = false;
          this.cdr.markForCheck();
        }
      );
  }

  public loadProjects(projects: string[]): void {
    projects.forEach(id => {
      this.projectsService
        .get(id)
        .pipe(untilDestroyed(this))
        .subscribe(project => {
          this.projects = [...this.projects, project];
          this.cdr.markForCheck();
        });
    });
  }

  public onRestoreVersion(): void {
    if (this.loading) {
      return;
    }
    this.loading = true;

    this.notesService
      .restoreVersion(this.id!, this.version!, Boolean(this.versionInProgress))
      .pipe(untilDestroyed(this))
      .subscribe(
        () => {
          this.state = ModalState.Changed;
          this.modalRef.close({ state: this.state });
          this.translocoService
            .selectTranslate('versions.toastr.success.versionRestored')
            .pipe(untilDestroyed(this))
            .subscribe(versionRestored => {
              this.toastrService.success(versionRestored);
            });
        },
        () => {
          this.loading = false;
          this.cdr.markForCheck();
        }
      );
  }
}
