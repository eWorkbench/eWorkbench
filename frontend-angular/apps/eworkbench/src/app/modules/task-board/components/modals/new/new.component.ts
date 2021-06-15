/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpParams } from '@angular/common/http';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Validators } from '@angular/forms';
import { ModalState } from '@app/enums/modal-state.enum';
import { ProjectsService, TaskBoardsService } from '@app/services';
import { Project, TaskBoardPayload } from '@eworkbench/types';
import { DialogRef } from '@ngneat/dialog';
import { FormBuilder, FormGroup } from '@ngneat/reactive-forms';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ToastrService } from 'ngx-toastr';
import { from, of, Subject } from 'rxjs';
import { catchError, debounceTime, mergeMap, switchMap } from 'rxjs/operators';

interface FormTaskBoard {
  title: string | null;
  projects: string[];
}

@UntilDestroy()
@Component({
  selector: 'eworkbench-new-task-board-modal',
  templateUrl: './new.component.html',
  styleUrls: ['./new.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewTaskBoardModalComponent implements OnInit {
  public initialState?: TaskBoardPayload = this.modalRef.data?.initialState;

  public withSidebar?: boolean = this.modalRef.data?.withSidebar;

  public state = ModalState.Unchanged;

  public loading = false;

  public projects: Project[] = [];

  public favoriteProjects: Project[] = [];

  public projectInput$ = new Subject<string>();

  public form = this.fb.group<FormTaskBoard>({
    title: [null, [Validators.required]],
    projects: [[]],
  });

  public constructor(
    public readonly modalRef: DialogRef,
    private readonly taskBoardsService: TaskBoardsService,
    private readonly fb: FormBuilder,
    private readonly cdr: ChangeDetectorRef,
    private readonly translocoService: TranslocoService,
    private readonly toastrService: ToastrService,
    private readonly projectsService: ProjectsService
  ) {}

  public get f(): FormGroup<FormTaskBoard>['controls'] {
    /* istanbul ignore next */
    return this.form.controls;
  }

  public get taskBoard(): TaskBoardPayload {
    if (this.initialState) {
      return {
        title: this.f.title.value!,
        projects: this.f.projects.value,
        background_color: this.initialState.background_color,
        kanban_board_columns: this.initialState.kanban_board_columns,
      };
    }

    return {
      title: this.f.title.value!,
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
        switchMap(/* istanbul ignore next */ input => (input ? this.projectsService.search(input) : of([...this.favoriteProjects])))
      )
      .subscribe(
        /* istanbul ignore next */ projects => {
          this.projects = [...projects].sort((a, b) => Number(b.is_favourite) - Number(a.is_favourite));
          this.cdr.markForCheck();
        }
      );

    this.projectsService
      .getList(new HttpParams().set('favourite', 'true'))
      .pipe(untilDestroyed(this))
      .subscribe(
        /* istanbul ignore next */ projects => {
          if (projects.data.length) {
            this.favoriteProjects = [...projects.data];
            this.projects = [...this.projects, ...this.favoriteProjects]
              .filter((value, index, array) => array.map(project => project.pk).indexOf(value.pk) === index)
              .sort((a, b) => Number(b.is_favourite) - Number(a.is_favourite));
            this.cdr.markForCheck();
          }
        }
      );
  }

  public patchFormValues(): void {
    if (this.initialState) {
      this.form.patchValue(
        {
          title: this.initialState.title,
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
                untilDestroyed(this),
                catchError(() => {
                  return of({ pk: id, name: this.translocoService.translate('formInput.unknownProject'), is_favourite: false } as Project);
                })
              )
            )
          )
          .subscribe(
            /* istanbul ignore next */ project => {
              this.projects = [...this.projects, project]
                .filter((value, index, array) => array.map(project => project.pk).indexOf(value.pk) === index)
                .sort((a, b) => Number(b.is_favourite) - Number(a.is_favourite));
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

    this.taskBoardsService
      .create(this.taskBoard)
      .pipe(untilDestroyed(this))
      .subscribe(
        /* istanbul ignore next */ taskBoard => {
          this.state = ModalState.Changed;
          this.modalRef.close({
            state: this.state,
            data: { newContent: taskBoard },
            navigate: [`${this.withSidebar ? '..' : ''}/taskboards`, taskBoard.pk],
          });
          this.translocoService
            .selectTranslate('taskBoard.newTaskBoardModal.toastr.success')
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
