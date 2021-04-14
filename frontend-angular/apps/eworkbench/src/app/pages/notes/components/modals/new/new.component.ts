/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Validators } from '@angular/forms';
import { ModalState } from '@app/enums/modal-state.enum';
import { NotesService, ProjectsService } from '@app/services';
import { Note, NotePayload, Project } from '@eworkbench/types';
import { DialogRef } from '@ngneat/dialog';
import { FormBuilder, FormGroup } from '@ngneat/reactive-forms';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ToastrService } from 'ngx-toastr';
import { from, of, Subject } from 'rxjs';
import { catchError, debounceTime, mergeMap, switchMap } from 'rxjs/operators';

interface FormNote {
  subject: string | null;
  content: string | null;
  projects: string[];
}

@UntilDestroy()
@Component({
  selector: 'eworkbench-new-note-modal',
  templateUrl: './new.component.html',
  styleUrls: ['./new.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewNoteModalComponent implements OnInit {
  public initialState?: Note = this.modalRef.data?.initialState;

  public loading = false;

  public state = ModalState.Unchanged;

  public projects: Project[] = [];

  public projectInput$ = new Subject<string>();

  public form: FormGroup<FormNote> = this.fb.group<FormNote>({
    subject: [null, [Validators.required]],
    content: null,
    projects: [[]],
  });

  public constructor(
    public readonly modalRef: DialogRef,
    public readonly notesService: NotesService,
    private readonly fb: FormBuilder,
    private readonly cdr: ChangeDetectorRef,
    private readonly translocoService: TranslocoService,
    private readonly toastrService: ToastrService,
    private readonly projectsService: ProjectsService
  ) {}

  public get f(): FormGroup<FormNote>['controls'] {
    return this.form.controls;
  }

  private get note(): NotePayload {
    return {
      subject: this.f.subject.value!,
      content: this.f.content.value ?? '',
      projects: this.f.projects.value,
    };
  }

  public ngOnInit(): void {
    this.initSearchInput();
    this.patchFormValues();
  }

  public initSearchInput(): void {
    this.projectInput$
      .pipe(
        untilDestroyed(this),
        debounceTime(500),
        switchMap(/* istanbul ignore next */ input => (input ? this.projectsService.search(input) : of([])))
      )
      .subscribe(
        /* istanbul ignore next */ projects => {
          if (projects.length) {
            this.projects = [...projects];
            this.cdr.markForCheck();
          }
        }
      );
  }

  public patchFormValues(): void {
    if (this.initialState) {
      this.form.patchValue(
        {
          subject: this.initialState.subject,
          content: this.initialState.content,
          projects: this.initialState.projects,
        },
        { emitEvent: false }
      );

      /* istanbul ignore next */
      if (this.initialState.projects.length) {
        from(this.initialState.projects)
          .pipe(
            untilDestroyed(this),
            mergeMap(id =>
              this.projectsService.get(id).pipe(
                catchError(() => {
                  return of({ pk: id, name: this.translocoService.translate('formInput.unknownProject') } as Project);
                })
              )
            )
          )
          .subscribe(
            /* istanbul ignore next */ project => {
              this.projects = [...this.projects, project];
              this.cdr.markForCheck();
            }
          );
      }
    }
  }

  public onSubmit(): void {
    if (this.loading) {
      return;
    }
    this.loading = true;

    this.notesService
      .add(this.note)
      .pipe(untilDestroyed(this))
      .subscribe(
        /* istanbul ignore next */ note => {
          this.state = ModalState.Changed;
          this.modalRef.close({ state: this.state, data: { newContent: note }, navigate: ['/comments', note.pk] });
          this.translocoService
            .selectTranslate('note.newModal.toastr.success')
            .pipe(untilDestroyed(this))
            .subscribe(success => {
              this.toastrService.success(success);
            });
        },
        /* istanbul ignore next */ () => {
          this.loading = false;
          this.cdr.markForCheck();
        }
      );
  }
}
