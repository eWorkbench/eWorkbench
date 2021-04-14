/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, OnDestroy, OnInit } from '@angular/core';
import { Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { ModalState } from '@app/enums/modal-state.enum';
import { NewLabelModalComponent } from '@app/modules/label/component/modals/new/new.component';
import { PendingChangesModalComponent } from '@app/modules/shared/modals/pending-changes/pending-changes.component';
import { NewTaskModalComponent } from '@app/modules/task/components/modals/new/new.component';
import { AuthService, LabelsService, PageTitleService, ProjectsService, TasksService, WebSocketService } from '@app/services';
import { UserService } from '@app/stores/user';
import {
  DateGroup,
  DropdownElement,
  Label,
  Lock,
  Metadata,
  ModalCallback,
  Privileges,
  Project,
  Task,
  TaskBoardAssignment,
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
import { from, Observable, of, Subject } from 'rxjs';
import { catchError, debounceTime, map, mergeMap, skip, switchMap, take } from 'rxjs/operators';

interface FormTask {
  title: string | null;
  assignees: number[];
  dateGroup: DateGroup;
  priority: string | null;
  state: string | null;
  checklist: TaskChecklist[];
  description: string | null;
  labels: string[];
  projects: string[];
}

@UntilDestroy()
@Component({
  templateUrl: './task-page.component.html',
  styleUrls: ['./task-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskPageComponent implements OnInit, OnDestroy {
  public detailsTitle?: string;

  public id = this.route.snapshot.paramMap.get('id')!;

  public currentUser: User | null = null;

  public initialState?: Task;

  public metadata?: Metadata[];

  public privileges?: Privileges;

  public lock: Lock | null = null;

  public modified = false;

  public loading = true;

  public modalRef?: DialogRef;

  public newModalComponent = NewTaskModalComponent;

  public refreshChanges = new EventEmitter<boolean>();

  public refreshVersions = new EventEmitter<boolean>();

  public refreshResetValue = new EventEmitter<boolean>();

  public refreshMetadata = new EventEmitter<boolean>();

  public assignees: User[] = [];

  public assigneesInput$ = new Subject<string>();

  public projects: Project[] = [];

  public projectInput$ = new Subject<string>();

  public labels: Label[] = [];

  public priority: DropdownElement[] = [];

  public stateItems: DropdownElement[] = [];

  public taskBoardAssignments: TaskBoardAssignment[] = [];

  public form: FormGroup<FormTask> = this.fb.group({
    title: [null, [Validators.required]],
    assignees: [[]],
    dateGroup: [{ start: null, end: null, fullDay: false }],
    priority: [null],
    state: [null],
    checklist: [[]],
    description: [null],
    labels: [[]],
    projects: [[]],
  });

  public constructor(
    public readonly tasksService: TasksService,
    private readonly fb: FormBuilder,
    private readonly cdr: ChangeDetectorRef,
    private readonly toastrService: ToastrService,
    private readonly translocoService: TranslocoService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly authService: AuthService,
    private readonly websocketService: WebSocketService,
    private readonly modalService: DialogService,
    private readonly projectsService: ProjectsService,
    private readonly userService: UserService,
    private readonly labelsService: LabelsService,
    private readonly pageTitleService: PageTitleService,
    private readonly titleService: Title
  ) {}

  public get f(): FormGroup<FormTask>['controls'] {
    /* istanbul ignore next */
    return this.form.controls;
  }

  public get lockUser(): { ownUser: boolean; user?: User | null } {
    /* istanbul ignore next */
    if (this.lock) {
      if (this.lock.lock_details?.locked_by.pk === this.currentUser?.pk) {
        return { ownUser: true, user: this.lock.lock_details?.locked_by };
      }

      return { ownUser: false, user: this.lock.lock_details?.locked_by };
    }

    /* istanbul ignore next */
    return { ownUser: false, user: null };
  }

  private get task(): TaskPayload {
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
      title: this.f.title.value!,
      assigned_users_pk: this.f.assignees.value,
      start_date: dateTimeStart,
      due_date: dateTimeEnd,
      full_day: this.f.dateGroup.value.fullDay,
      priority: (this.f.priority.value as Task['priority'] | null) ?? 'NORM',
      state: (this.f.state.value as Task['state'] | null) ?? 'NEW',
      description: this.f.description.value ?? '',
      projects: this.f.projects.value,
      checklist_items: this.f.checklist.value,
      labels: this.f.labels.value,
      metadata: this.metadata,
    };
  }

  public ngOnInit(): void {
    /* istanbul ignore next */
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;

    this.authService.user$.pipe(untilDestroyed(this)).subscribe(state => {
      this.currentUser = state.user;
    });

    this.websocketService.subscribe([{ model: 'task', pk: this.id }]);
    this.websocketService.elements.pipe(untilDestroyed(this)).subscribe(
      /* istanbul ignore next */ (data: any) => {
        /* istanbul ignore next */
        if (data.element_lock_changed?.model_pk === this.id) {
          this.lock = data.element_lock_changed;
          this.cdr.detectChanges();
        }

        /* istanbul ignore next */
        if (data.element_changed?.model_pk === this.id) {
          if (this.lockUser.user && !this.lockUser.ownUser) {
            this.modified = true;
          } else {
            this.modified = false;
          }
          this.cdr.detectChanges();
        }
      }
    );

    this.initTranslations();
    this.initSearchInput();
    this.initDetails();
    this.initPageTitle();
  }

  public ngOnDestroy(): void {
    this.websocketService.unsubscribe();
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

  public initFormChanges(): void {
    this.form.valueChanges
      .pipe(
        untilDestroyed(this),
        skip(1),
        debounceTime(500),
        switchMap(() => {
          this.cdr.markForCheck();
          if (!this.lock?.locked) {
            return this.tasksService.lock(this.id);
          }

          return of([]);
        }),
        debounceTime(500)
      )
      .subscribe();
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
          }
        }
      );
  }

  public initPageTitle(): void {
    this.pageTitleService
      .get()
      .pipe(untilDestroyed(this))
      .subscribe(title => {
        this.titleService.setTitle(title);
      });
  }

  public initDetails(formChanges = true): void {
    if (!this.currentUser?.pk) {
      return;
    }

    this.tasksService
      .get(this.id, this.currentUser.pk)
      .pipe(
        untilDestroyed(this),
        map(
          /* istanbul ignore next */ privilegesData => {
            const task = privilegesData.data;
            const privileges = privilegesData.privileges;

            this.form.patchValue(
              {
                title: task.title,
                assignees: task.assigned_users_pk,
                dateGroup: { start: task.start_date, end: task.due_date, fullDay: task.full_day },
                priority: task.priority,
                state: task.state,
                checklist: task.checklist_items,
                description: task.description,
                labels: task.labels,
                projects: task.projects,
              },
              { emitEvent: false }
            );

            if (!privileges.edit) {
              this.form.disable({ emitEvent: false });
            }

            return privilegesData;
          }
        ),
        switchMap(
          /* istanbul ignore next */ privilegesData => {
            if (privilegesData.data.projects.length) {
              return from(privilegesData.data.projects).pipe(
                mergeMap(id =>
                  this.projectsService.get(id).pipe(
                    catchError(() => {
                      return of({ pk: id, name: this.translocoService.translate('formInput.unknownProject') } as Project);
                    })
                  )
                ),
                map(project => {
                  this.projects = [...this.projects, project];
                  this.cdr.markForCheck();
                }),
                switchMap(() => of(privilegesData))
              );
            }

            return of(privilegesData);
          }
        ),
        switchMap(
          /* istanbul ignore next */ privilegesData =>
            this.labelsService.get().pipe(
              map(
                /* istanbul ignore next */ labels => {
                  this.labels = [];
                  privilegesData.data.labels.forEach(label => {
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
              ),
              switchMap(() => of(privilegesData))
            )
        ),
        switchMap(
          /* istanbul ignore next */ privilegesData =>
            this.tasksService.getTaskBoardAssignments(this.id).pipe(
              map(
                /* istanbul ignore next */ assignments => {
                  this.taskBoardAssignments = [...assignments];
                }
              ),
              switchMap(() => of(privilegesData))
            )
        )
      )
      .subscribe(
        /* istanbul ignore next */ privilegesData => {
          const task = privilegesData.data;
          const privileges = privilegesData.privileges;

          this.detailsTitle = task.display;
          this.pageTitleService.set(task.display);

          this.initialState = { ...task };
          this.privileges = { ...privileges };
          this.assignees = [...task.assigned_users];

          this.loading = false;

          if (formChanges) {
            this.initFormChanges();
          }

          this.cdr.markForCheck();
        },
        /* istanbul ignore next */ (error: HttpErrorResponse) => {
          if (error.status === 404) {
            this.router.navigate(['/not-found']);
          }

          this.loading = false;
          this.cdr.markForCheck();
        }
      );
  }

  public onSubmit(): void {
    if (this.loading) {
      return;
    }
    this.loading = true;

    this.tasksService
      .patch(this.id, this.task)
      .pipe(untilDestroyed(this))
      .subscribe(
        /* istanbul ignore next */ task => {
          if (this.lock?.locked && this.lockUser.ownUser) {
            this.tasksService.unlock(this.id);
          }

          this.detailsTitle = task.display;
          this.pageTitleService.set(task.display);

          this.initialState = { ...task };
          this.form.patchValue({ checklist: this.initialState.checklist_items }, { emitEvent: false });
          this.form.markAsPristine();
          this.refreshChanges.next(true);
          this.refreshVersions.next(true);
          this.refreshMetadata.next(true);
          this.refreshResetValue.next(true);

          this.loading = false;
          this.cdr.markForCheck();
          this.translocoService
            .selectTranslate('task.details.toastr.success')
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

  public pendingChanges(): Observable<boolean> {
    if (this.form.dirty) {
      this.modalRef = this.modalService.open(PendingChangesModalComponent, {
        closeButton: false,
      });
      /* istanbul ignore next */
      return this.modalRef.afterClosed$.pipe(
        untilDestroyed(this),
        take(1),
        map(val => Boolean(val))
      );
    }

    return of(true);
  }

  public openLabelsModal(): void {
    /* istanbul ignore next */
    this.modalRef = this.modalService.open(NewLabelModalComponent, { closeButton: false });
    /* istanbul ignore next */
    this.modalRef.afterClosed$.pipe(untilDestroyed(this), take(1)).subscribe((callback: ModalCallback) => this.onModalClose(callback));
  }

  public onModalClose(callback?: ModalCallback): void {
    /* istanbul ignore next */
    if (callback?.state === ModalState.Changed) {
      if (callback.data) {
        this.labels = [...this.labels, callback.data];
        const labels = this.labels.map(label => label.pk);

        this.tasksService
          .patch(this.id, { labels })
          .pipe(untilDestroyed(this))
          .subscribe(/* istanbul ignore next */ () => this.f.labels.setValue(labels));
      }
      this.cdr.markForCheck();
    }
  }

  public onVersionChanged(): void {
    this.initDetails(false);
    this.refreshVersions.next(true);
    this.refreshChanges.next(true);
    this.refreshMetadata.next(true);
  }

  public onUpdateMetadata(metadata: Metadata[]): void {
    this.metadata = metadata;
  }

  public labelChange(labels: Label[]): void {
    this.labels = [...labels];
    this.f.labels.setValue(labels.map(label => label.pk));
  }

  public changeAssignees(assignees: User[]): void {
    this.assignees = [...assignees];
    this.cdr.markForCheck();
  }
}
