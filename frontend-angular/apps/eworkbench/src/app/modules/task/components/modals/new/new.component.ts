/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Validators } from '@angular/forms';
import { ModalState } from '@app/enums/modal-state.enum';
import { NewLabelModalComponent } from '@app/modules/label/component/modals/new/new.component';
import { LabelsService, ProjectsService, TasksBacklogService, TasksService } from '@app/services';
import { UserService } from '@app/stores/user';
import {
  DateGroup,
  DropdownElement,
  Label,
  ModalCallback,
  Project,
  Task,
  TaskBoardColumn,
  TaskChecklist,
  TaskPayload,
  User,
} from '@eworkbench/types';
import { DialogRef, DialogService } from '@ngneat/dialog';
import { FormBuilder, FormGroup } from '@ngneat/reactive-forms';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { set } from 'date-fns';
import { ToastrService } from 'ngx-toastr';
import { from, of, Subject } from 'rxjs';
import { catchError, debounceTime, map, mergeMap, switchMap, take } from 'rxjs/operators';

interface FormTask {
  title: string | null;
  assignees: number[];
  dateGroup: DateGroup;
  priority: TaskPayload['priority'] | null;
  state: TaskPayload['state'] | null;
  checklist: TaskChecklist[];
  description: string | null;
  projects: string[];
  labels: string[];
}

@UntilDestroy()
@Component({
  selector: 'eworkbench-new-task-modal',
  templateUrl: './new.component.html',
  styleUrls: ['./new.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewTaskModalComponent implements OnInit {
  public taskBoardId?: string = this.modalRef.data?.taskBoardId;

  public column?: TaskBoardColumn[] = this.modalRef.data?.column;

  public initialState?: Task = this.modalRef.data?.initialState;

  public withSidebar?: boolean = this.modalRef.data?.withSidebar;

  public state = ModalState.Unchanged;

  public loading = false;

  public modal?: DialogRef;

  public assignees: User[] = [];

  public assigneesInput$ = new Subject<string>();

  public projects: Project[] = [];

  public projectInput$ = new Subject<string>();

  public labels: Label[] = [];

  public priority: DropdownElement[] = [];

  public stateItems: DropdownElement[] = [];

  public form = this.fb.group<FormTask>({
    title: [null, [Validators.required]],
    assignees: [[]],
    dateGroup: [{ start: null, end: null, fullDay: false }],
    priority: ['NORM', [Validators.required]],
    state: ['NEW', [Validators.required]],
    checklist: [[]],
    description: [null],
    projects: [[]],
    labels: [[]],
  });

  public constructor(
    public readonly modalRef: DialogRef,
    private readonly fb: FormBuilder,
    private readonly tasksService: TasksService,
    private readonly tasksBacklogService: TasksBacklogService,
    private readonly modalService: DialogService,
    private readonly cdr: ChangeDetectorRef,
    private readonly projectsService: ProjectsService,
    private readonly userService: UserService,
    private readonly toastrService: ToastrService,
    private readonly translocoService: TranslocoService,
    private readonly labelsService: LabelsService
  ) {}

  public get f(): FormGroup<FormTask>['controls'] {
    /* istanbul ignore next */
    return this.form.controls;
  }

  public get task(): TaskPayload {
    let dateTimeStart = null;
    if (this.f.dateGroup.value.start) {
      dateTimeStart = new Date(Date.parse(this.f.dateGroup.value.start));
      if (this.f.dateGroup.value.fullDay) {
        dateTimeStart = set(dateTimeStart, { hours: 0, minutes: 0, seconds: 0, milliseconds: 0 });
      }
      dateTimeStart = dateTimeStart.toISOString();
    }

    let dateTimeEnd = null;
    if (this.f.dateGroup.value.end) {
      dateTimeEnd = new Date(Date.parse(this.f.dateGroup.value.end));
      if (this.f.dateGroup.value.fullDay) {
        dateTimeEnd = set(dateTimeEnd, { hours: 23, minutes: 59, seconds: 59, milliseconds: 999 });
      }
      dateTimeEnd = dateTimeEnd.toISOString();
    }

    return {
      assigned_users_pk: this.f.assignees.value,
      checklist_items: this.f.checklist.value,
      labels: this.f.labels.value,
      projects: this.f.projects.value,
      start_date: dateTimeStart,
      due_date: dateTimeEnd,
      full_day: this.f.dateGroup.value.fullDay,
      title: this.f.title.value!,
      priority: this.f.priority.value ?? 'NORM',
      state: this.f.state.value ?? 'NEW',
      description: this.f.description.value ?? '',
    };
  }

  public ngOnInit(): void {
    this.initTranslations();
    this.initSearchInput();
    this.patchFormValues();
  }

  public initTranslations(): void {
    this.translocoService
      .selectTranslateObject('tasks')
      .pipe(untilDestroyed(this))
      .subscribe(tasks => {
        this.priority = [
          { label: tasks.priority.veryHigh, value: 'VHIGH' },
          { label: tasks.priority.high, value: 'HIGH' },
          { label: tasks.priority.normal, value: 'NORM' },
          { label: tasks.priority.low, value: 'LOW' },
          { label: tasks.priority.veryLow, value: 'VLOW' },
        ];

        this.stateItems = [
          { label: tasks.state.new, value: 'NEW' },
          { label: tasks.state.inProgress, value: 'PROG' },
          { label: tasks.state.done, value: 'DONE' },
        ];
      });
  }

  public initSearchInput(): void {
    this.assigneesInput$
      .pipe(
        untilDestroyed(this),
        debounceTime(500),
        switchMap(/* istanbul ignore next */ input => (input ? this.userService.search(input) : of([])))
      )
      .subscribe(
        /* istanbul ignore next */ users => {
          if (users.length) {
            this.assignees = [...users];
            this.cdr.markForCheck();
          }
        }
      );

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
          } else {
            this.projects = [];
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
          assignees: this.initialState.assigned_users_pk,
          dateGroup: {
            start: this.initialState.start_date,
            end: this.initialState.due_date,
            fullDay: this.initialState.full_day,
          },
          priority: this.initialState.priority,
          state: this.initialState.state,
          checklist: this.initialState.checklist_items,
          description: this.initialState.description,
          projects: this.initialState.projects,
          labels: this.initialState.labels,
        },
        { emitEvent: false }
      );

      if (!this.f.state.value) {
        this.form.patchValue({ state: 'NEW' }, { emitEvent: false });
      }

      if (!this.f.priority.value) {
        this.form.patchValue({ priority: 'NORM' }, { emitEvent: false });
      }

      this.assignees = [...(this.initialState.assigned_users ??= [])];
      this.projects = [];
      this.labels = [];

      this.initialState.labels ??= [];
      if (this.initialState.labels.length) {
        this.labelsService
          .get()
          .pipe(
            untilDestroyed(this),
            map(
              /* istanbul ignore next */ labels => {
                this.initialState!.labels.forEach(label => {
                  labels.forEach(apiLabel => {
                    if (label === apiLabel.pk) {
                      if (this.labels.length) {
                        this.labels = [...this.labels, apiLabel];
                        this.cdr.markForCheck();
                      } else {
                        this.labels = [apiLabel];
                        this.cdr.markForCheck();
                      }
                    }
                  });
                });
              }
            )
          )
          .subscribe(() => this.cdr.markForCheck());
      }

      this.initialState.projects ??= [];
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

    /* istanbul ignore next */
    if (this.column) {
      this.tasksService
        .add(this.task)
        .pipe(
          untilDestroyed(this),
          switchMap(
            /* istanbul ignore next */ task =>
              this.tasksBacklogService.addTasks(this.taskBoardId!, [{ task_id: task.pk, kanban_board_column: this.column }])
          )
        )
        .subscribe(
          /* istanbul ignore next */ () => {
            this.state = ModalState.Changed;
            this.modalRef.close({ state: this.state });
          },
          /* istanbul ignore next */ () => {
            this.loading = false;
            this.cdr.markForCheck();
          }
        );
    } else {
      this.tasksService
        .add(this.task)
        .pipe(untilDestroyed(this))
        .subscribe(
          /* istanbul ignore next */ task => {
            this.state = ModalState.Changed;
            this.modalRef.close({
              state: this.state,
              data: { newContent: task },
              navigate: [`${this.withSidebar ? '..' : ''}/tasks`, task.pk],
            });
            this.translocoService
              .selectTranslate('task.newTaskModal.toastr.success')
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

  public openLabelsModal(): void {
    /* istanbul ignore next */
    this.modal = this.modalService.open(NewLabelModalComponent, { closeButton: false });
    /* istanbul ignore next */
    this.modal.afterClosed$.pipe(untilDestroyed(this), take(1)).subscribe((callback: ModalCallback) => this.onModalClose(callback));
  }

  public onModalClose(callback?: ModalCallback): void {
    if (callback?.state === ModalState.Changed) {
      if (callback.data) {
        this.labels = [...this.labels, callback.data];
        this.f.labels.setValue(this.labels.map(label => label.pk));
      }
      this.cdr.markForCheck();
    }
  }

  public changeAssignees(assignees: User[]): void {
    this.assignees = [...assignees];
    this.cdr.markForCheck();
  }

  public labelChange(labels: Label[]): void {
    this.labels = [...labels];
    this.f.labels.setValue(this.labels.map(label => label.pk));
  }
}
