/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { CDK_DRAG_CONFIG } from '@angular/cdk/drag-drop';
import { HttpParams } from '@angular/common/http';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Validators } from '@angular/forms';
import { ModalState } from '@app/enums/modal-state.enum';
import { NewLabelModalComponent } from '@app/modules/label/component/modals/new/new.component';
import { LabelsService, ProjectsService, TasksBacklogService, TasksService } from '@app/services';
import { UserService } from '@app/stores/user';
import type {
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
import { FormBuilder, FormControl } from '@ngneat/reactive-forms';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { set } from 'date-fns';
import { ToastrService } from 'ngx-toastr';
import { from, of, Subject } from 'rxjs';
import { catchError, debounceTime, map, mergeMap, switchMap, take } from 'rxjs/operators';

interface FormTask {
  title: FormControl<string | null>;
  assignees: FormControl<number[]>;
  scheduledNotificationActive: FormControl<boolean>;
  scheduledNotificationTime: FormControl<DateGroup>;
  dateGroup: FormControl<DateGroup>;
  priority: FormControl<TaskPayload['priority'] | null>;
  state: FormControl<TaskPayload['state'] | null>;
  checklist: FormControl<TaskChecklist[]>;
  description: string | null;
  projects: FormControl<string[]>;
  labels: FormControl<string[]>;
  duplicateMetadata: boolean;
}

@UntilDestroy()
@Component({
  selector: 'eworkbench-new-task-modal',
  templateUrl: './new.component.html',
  styleUrls: ['./new.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: CDK_DRAG_CONFIG,
      useValue: {
        zIndex: 1100,
      },
    },
  ],
})
export class NewTaskModalComponent implements OnInit {
  public taskBoardId?: string = this.modalRef.data?.taskBoardId;

  public column?: TaskBoardColumn[] = this.modalRef.data?.column;

  public initialState?: Task = this.modalRef.data?.initialState;

  public withSidebar?: boolean = this.modalRef.data?.withSidebar;

  public duplicate?: string = this.modalRef.data?.duplicate;

  public state = ModalState.Unchanged;

  public loading = false;

  public modal?: DialogRef;

  public assignees: User[] = [];

  public assigneesInput$ = new Subject<string>();

  public projects: Project[] = [];

  public favoriteProjects: Project[] = [];

  public projectInput$ = new Subject<string>();

  public labels: Label[] = [];

  public priority: DropdownElement[] = [];

  public stateItems: DropdownElement[] = [];

  public customLabel = {
    start: null,
    end: null,
  };

  public customPlaceholder = {
    start: null,
    end: null,
  };

  public form = this.fb.group<FormTask>({
    title: this.fb.control(null, Validators.required),
    assignees: this.fb.control([]),
    scheduledNotificationActive: this.fb.control({ value: false, disabled: true }),
    scheduledNotificationTime: this.fb.control({ start: null, end: null, fullDay: false }),
    dateGroup: this.fb.control({ start: null, end: null, fullDay: false }),
    priority: this.fb.control('NORM', Validators.required),
    state: this.fb.control('NEW', Validators.required),
    checklist: this.fb.control([]),
    description: null,
    projects: this.fb.control([]),
    labels: this.fb.control([]),
    duplicateMetadata: true,
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

  public get f() {
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

    const task = {
      assigned_users_pk: this.f.assignees.value,
      remind_assignees: this.f.scheduledNotificationActive.value,
      reminder_datetime: this.f.scheduledNotificationTime.value.start,
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
      metadata: this.duplicate && this.f.duplicateMetadata.value ? this.initialState?.metadata : [],
    };

    // The property 'reminder_datetime' must not exist if remind_assignees field contains null values
    if (!this.f.scheduledNotificationActive.value) {
      // @ts-expect-error
      delete task.reminder_datetime;
    }

    return task;
  }

  public ngOnInit(): void {
    this.f.assignees.valueChanges.pipe(untilDestroyed(this)).subscribe(value => {
      if (value.length) {
        this.f.scheduledNotificationActive.enable();
      } else {
        this.f.scheduledNotificationActive.disable();
      }
    });

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

    this.translocoService
      .selectTranslateObject('task.formDateGroup')
      .pipe(untilDestroyed(this))
      .subscribe(formGroup => {
        this.customLabel = {
          start: formGroup.label.start,
          end: formGroup.label.end,
        };

        this.customPlaceholder = {
          start: formGroup.placeholder.start,
          end: formGroup.placeholder.end,
        };
      });
  }

  public initSearchInput(): void {
    this.assigneesInput$
      .pipe(
        untilDestroyed(this),
        debounceTime(500),
        switchMap(input => (input ? this.userService.search(input) : of([])))
      )
      .subscribe(users => {
        if (users.length) {
          this.assignees = [...users];
          this.cdr.markForCheck();
        }
      });

    this.projectInput$
      .pipe(
        untilDestroyed(this),
        debounceTime(500),
        switchMap(input => (input ? this.projectsService.search(input) : of([...this.favoriteProjects])))
      )
      .subscribe(projects => {
        this.projects = [...projects].sort((a, b) => Number(b.is_favourite) - Number(a.is_favourite));
        this.cdr.markForCheck();
      });

    this.projectsService
      .getList(new HttpParams().set('favourite', 'true'))
      .pipe(untilDestroyed(this))
      .subscribe(projects => {
        if (projects.data.length) {
          this.favoriteProjects = [...projects.data];
          this.projects = [...this.projects, ...this.favoriteProjects]
            .filter((value, index, array) => array.map(project => project.pk).indexOf(value.pk) === index)
            .sort((a, b) => Number(b.is_favourite) - Number(a.is_favourite));
          this.cdr.markForCheck();
        }
      });
  }

  public patchFormValues(): void {
    if (this.initialState) {
      this.form.patchValue(
        {
          title: this.initialState.title,
          assignees: this.initialState.assigned_users_pk,
          scheduledNotificationActive: this.initialState.remind_assignees,
          scheduledNotificationTime: { start: this.initialState.reminder_datetime },
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

      if (this.f.scheduledNotificationActive.value) {
        this.f.scheduledNotificationActive.enable({ emitEvent: false });
      }

      if (!this.f.scheduledNotificationActive.value) {
        const date = new Date();
        this.form.patchValue(
          {
            scheduledNotificationTime: {
              start: set(date, { hours: date.getHours() + 1, minutes: 0, seconds: 0 }).toISOString(),
            },
          },
          { emitEvent: false }
        );
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
            map(labels => {
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
            })
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
                untilDestroyed(this),
                catchError(() =>
                  of({ pk: id, name: this.translocoService.translate('formInput.unknownProject'), is_favourite: false } as Project)
                )
              )
            )
          )
          .subscribe(project => {
            this.projects = [...this.projects, project]
              .filter((value, index, array) => array.map(project => project.pk).indexOf(value.pk) === index)
              .sort((a, b) => Number(b.is_favourite) - Number(a.is_favourite));
            this.cdr.markForCheck();
          });
      }
    }
  }

  public onSubmit(): void {
    if (this.loading) {
      return;
    }
    this.loading = true;

    if (this.column) {
      this.tasksService
        .add(this.task)
        .pipe(
          untilDestroyed(this),
          switchMap(task => this.tasksBacklogService.addTasks(this.taskBoardId!, [{ task_id: task.pk, kanban_board_column: this.column }]))
        )
        .subscribe(
          () => {
            this.state = ModalState.Changed;
            this.modalRef.close({ state: this.state });
          },
          () => {
            this.loading = false;
            this.cdr.markForCheck();
          }
        );
    } else {
      this.tasksService
        .add(this.task)
        .pipe(untilDestroyed(this))
        .subscribe(
          task => {
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
          () => {
            this.loading = false;
            this.cdr.markForCheck();
          }
        );
    }
  }

  public openLabelsModal(): void {
    this.modal = this.modalService.open(NewLabelModalComponent, { closeButton: false });

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
