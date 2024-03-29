/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpErrorResponse, HttpParams } from '@angular/common/http';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { ModalState } from '@app/enums/modal-state.enum';
import { ProjectSidebarItem } from '@app/enums/project-sidebar-item.enum';
import { CommentsComponent } from '@app/modules/comment/components/comments/comments.component';
import { NewCommentModalComponent } from '@app/modules/comment/components/modals/new/new.component';
import { NewLabelModalComponent } from '@app/modules/label/component/modals/new/new.component';
import { DescriptionModalComponent } from '@app/modules/shared/modals/description/description.component';
import { PendingChangesModalComponent } from '@app/modules/shared/modals/pending-changes/pending-changes.component';
import { NewTaskModalComponent } from '@app/modules/task/components/modals/new/new.component';
import { LeaveProjectModalComponent } from '@app/pages/projects/components/modals/leave/leave.component';
import { AuthService, LabelsService, PageTitleService, ProjectsService, TasksService, WebSocketService } from '@app/services';
import { UserService, UserStore } from '@app/stores/user';
import type {
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
import { FormBuilder, FormControl } from '@ngneat/reactive-forms';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { set } from 'date-fns';
import { ToastrService } from 'ngx-toastr';
import { from, Observable, of, Subject } from 'rxjs';
import { catchError, debounceTime, map, mergeMap, skip, switchMap, take } from 'rxjs/operators';

interface FormTask {
  title: FormControl<string | null>;
  assignees: FormControl<number[]>;
  scheduledNotificationActive: FormControl<boolean>;
  scheduledNotificationTime: FormControl<DateGroup>;
  dateGroup: FormControl<DateGroup>;
  priority: string | null;
  state: string | null;
  checklist: FormControl<TaskChecklist[]>;
  labels: FormControl<string[]>;
  projects: FormControl<string[]>;
}

@UntilDestroy()
@Component({
  templateUrl: './task-page.component.html',
  styleUrls: ['./task-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskPageComponent implements OnInit, OnDestroy {
  @ViewChild(CommentsComponent)
  public comments!: CommentsComponent;

  public detailsTitle?: string;

  public id = this.route.snapshot.paramMap.get('id')!;

  public sidebarItem = ProjectSidebarItem.Tasks;

  public currentUser: User | null = null;

  public initialState?: Task;

  public metadata?: Metadata[];

  public privileges?: Privileges;

  public lock: Lock | null = null;

  public modified = false;

  public showSidebar = false;

  public loading = true;

  public modalRef?: DialogRef;

  public newModalComponent = NewTaskModalComponent;

  public refreshChanges = new EventEmitter<boolean>();

  public refreshVersions = new EventEmitter<boolean>();

  public refreshResetValue = new EventEmitter<boolean>();

  public refreshMetadata = new EventEmitter<boolean>();

  public refreshLinkList = new EventEmitter<boolean>();

  public assignees: User[] = [];

  public assigneesInput$ = new Subject<string>();

  public projects: Project[] = [];

  public favoriteProjects: Project[] = [];

  public projectInput$ = new Subject<string>();

  public labels: Label[] = [];

  public priority: DropdownElement[] = [];

  public stateItems: DropdownElement[] = [];

  public taskBoardAssignments: TaskBoardAssignment[] = [];

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
    priority: null,
    state: null,
    checklist: this.fb.control([]),
    labels: this.fb.control([]),
    projects: this.fb.control([]),
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
    private readonly titleService: Title,
    private readonly userStore: UserStore
  ) {}

  public get f() {
    return this.form.controls;
  }

  public get lockUser(): { ownUser: boolean; user?: User | undefined | null } {
    if (this.lock) {
      if (this.lock.lock_details?.locked_by.pk === this.currentUser?.pk) {
        return { ownUser: true, user: this.lock.lock_details?.locked_by };
      }

      return { ownUser: false, user: this.lock.lock_details?.locked_by };
    }

    return { ownUser: false, user: null };
  }

  public get descriptionTranslationKey(): string {
    return this.initialState?.description ? 'task.details.description.edit' : 'task.details.description.add';
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

    const task = {
      title: this.f.title.value!,
      assigned_users_pk: this.f.assignees.value,
      remind_assignees: this.f.scheduledNotificationActive.value,
      reminder_datetime: this.f.scheduledNotificationTime.value.start,
      start_date: dateTimeStart,
      due_date: dateTimeEnd,
      full_day: this.f.dateGroup.value.fullDay,
      priority: (this.f.priority.value as Task['priority'] | null) ?? '3',
      state: (this.f.state.value as Task['state'] | null) ?? 'NEW',
      projects: this.f.projects.value,
      checklist_items: this.f.checklist.value,
      labels: this.f.labels.value,
      metadata: this.metadata!,
    };

    // The property 'reminder_datetime' must not exist if remind_assignees field contains null values
    if (!this.f.scheduledNotificationActive.value) {
      // @ts-expect-error
      delete task.reminder_datetime;
    }

    return task;
  }

  public ngOnInit(): void {
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;

    this.authService.user$.pipe(untilDestroyed(this)).subscribe(state => {
      this.currentUser = state.user;
    });

    this.websocketService.subscribe([{ model: 'task', pk: this.id }]);
    this.websocketService.elements.pipe(untilDestroyed(this)).subscribe((data: any) => {
      if (data.element_lock_changed?.model_pk === this.id) {
        this.lock = data.element_lock_changed;
        this.cdr.detectChanges();
      }

      if (data.element_changed?.model_pk === this.id) {
        if (this.lockUser.user && !this.lockUser.ownUser) {
          this.modified = true;
        } else {
          this.modified = false;
        }
        this.cdr.detectChanges();
      }
    });

    this.f.assignees.valueChanges.pipe(untilDestroyed(this)).subscribe(value => {
      if (value.length) {
        this.f.scheduledNotificationActive.enable();
      } else {
        this.f.scheduledNotificationActive.disable();
      }
    });

    this.initTranslations();
    this.initSidebar();
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
          { label: tasks.priority.veryHigh, value: '5' },
          { label: tasks.priority.high, value: '4' },
          { label: tasks.priority.normal, value: '3' },
          { label: tasks.priority.low, value: '2' },
          { label: tasks.priority.veryLow, value: '1' },
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

  public initFormChanges(): void {
    this.form.valueChanges
      .pipe(
        untilDestroyed(this),
        skip(3),
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

  public initSidebar(): void {
    this.route.params.subscribe(params => {
      if (params.projectId) {
        this.showSidebar = true;

        this.projectsService.get(params.projectId).subscribe(project => {
          this.projects = [...this.projects, project]
            .filter((value, index, array) => array.map(project => project.pk).indexOf(value.pk) === index)
            .sort((a, b) => Number(b.is_favourite) - Number(a.is_favourite));
          this.cdr.markForCheck();
        });
      }
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
        map(privilegesData => {
          const task = privilegesData.data;
          const privileges = privilegesData.privileges;

          this.form.patchValue(
            {
              title: task.title,
              assignees: task.assigned_users_pk,
              scheduledNotificationActive: task.remind_assignees,
              scheduledNotificationTime: { start: task.reminder_datetime },
              dateGroup: { start: task.start_date, end: task.due_date, fullDay: task.full_day },
              priority: task.priority,
              state: task.state,
              checklist: task.checklist_items,
              labels: task.labels,
              projects: task.projects,
            },
            { emitEvent: false }
          );

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

          if (this.f.assignees.value.length) {
            this.f.assignees.enable();
          }

          if (!privileges.edit) {
            this.form.disable({ emitEvent: false });
          }

          return privilegesData;
        }),
        switchMap(privilegesData => {
          if (privilegesData.data.projects.length) {
            return from(privilegesData.data.projects).pipe(
              mergeMap(id =>
                this.projectsService.get(id).pipe(
                  untilDestroyed(this),
                  catchError(() =>
                    of({
                      pk: id,
                      name: this.translocoService.translate('formInput.unknownProject'),
                      is_favourite: false,
                    } as Project)
                  )
                )
              ),
              map(project => {
                this.projects = [...this.projects, project]
                  .filter((value, index, array) => array.map(project => project.pk).indexOf(value.pk) === index)
                  .sort((a, b) => Number(b.is_favourite) - Number(a.is_favourite));
                this.cdr.markForCheck();
              }),
              switchMap(() => of(privilegesData))
            );
          }

          return of(privilegesData);
        }),
        switchMap(privilegesData =>
          this.labelsService.get().pipe(
            map(labels => {
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
            }),
            switchMap(() => of(privilegesData))
          )
        ),
        switchMap(privilegesData =>
          this.tasksService.getTaskBoardAssignments(this.id).pipe(
            map(assignments => {
              this.taskBoardAssignments = [...assignments];
            }),
            switchMap(() => of(privilegesData))
          )
        )
      )
      .subscribe(
        privilegesData => {
          const task = privilegesData.data;
          const privileges = privilegesData.privileges;

          this.detailsTitle = task.display;
          void this.pageTitleService.set(task.display);

          this.initialState = { ...task };
          this.privileges = { ...privileges };
          this.assignees = [...task.assigned_users];

          this.loading = false;

          if (formChanges) {
            this.initFormChanges();
          }

          this.cdr.markForCheck();
        },
        (error: HttpErrorResponse) => {
          if (error.status === 404) {
            void this.router.navigate(['/not-found']);
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
        task => {
          if (this.lock?.locked && this.lockUser.ownUser) {
            this.tasksService.unlock(this.id);
          }

          this.detailsTitle = task.display;
          void this.pageTitleService.set(task.display);

          this.initialState = { ...task };
          this.form.patchValue({ checklist: this.initialState.checklist_items }, { emitEvent: false });
          this.form.markAsPristine();
          this.refreshChanges.next(true);
          this.refreshVersions.next(true);
          this.refreshMetadata.next(true);
          this.refreshLinkList.next(true);
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
        () => {
          this.loading = false;
          this.cdr.markForCheck();
        }
      );
  }

  public canDeactivate(): Observable<boolean> {
    if (this.showSidebar) {
      const userStoreValue = this.userStore.getValue();
      const userSetting = 'SkipDialog-LeaveProject';

      const skipLeaveDialog = Boolean(userStoreValue.user?.userprofile.ui_settings?.confirm_dialog?.[userSetting]);

      if (skipLeaveDialog) {
        return of(true);
      }

      this.modalRef = this.modalService.open(LeaveProjectModalComponent, {
        closeButton: false,
      });

      return this.modalRef.afterClosed$.pipe(
        untilDestroyed(this),
        take(1),
        map(val => Boolean(val))
      );
    }

    return of(true);
  }

  public pendingChanges(): Observable<boolean> {
    if (this.form.dirty) {
      this.modalRef = this.modalService.open(PendingChangesModalComponent, {
        closeButton: false,
      });

      return this.modalRef.afterClosed$.pipe(
        untilDestroyed(this),
        take(1),
        map(val => Boolean(val))
      );
    }

    return of(true);
  }

  public openLabelsModal(): void {
    this.modalRef = this.modalService.open(NewLabelModalComponent, { closeButton: false });

    this.modalRef.afterClosed$.pipe(untilDestroyed(this), take(1)).subscribe((callback: ModalCallback) => this.onModalClose(callback));
  }

  public onModalClose(callback?: ModalCallback): void {
    if (callback?.state === ModalState.Changed) {
      if (callback.data) {
        this.labels = [...this.labels, callback.data];
        const labels = this.labels.map(label => label.pk);

        this.tasksService
          .patch(this.id, { labels })
          .pipe(untilDestroyed(this))
          .subscribe(() => this.f.labels.setValue(labels));
      }
      this.cdr.markForCheck();
    }
  }

  public onVersionChanged(): void {
    this.initDetails(false);
    this.refreshVersions.next(true);
    this.refreshChanges.next(true);
    this.refreshMetadata.next(true);
    this.refreshLinkList.next(true);
  }

  public onRefreshLinkList(): void {
    this.refreshLinkList.next(true);
  }

  public onOpenNewCommentModal(): void {
    this.modalRef = this.modalService.open(NewCommentModalComponent, {
      closeButton: false,
      width: '912px',
      data: {
        id: this.id,
        contentType: this.initialState?.content_type,
        service: this.tasksService,
      },
    });

    this.modalRef.afterClosed$.pipe(untilDestroyed(this), take(1)).subscribe((callback: ModalCallback) => {
      if (callback.state === ModalState.Changed) {
        this.comments.loadComments();
      }
    });
  }

  public onOpenDescriptionModal(): void {
    this.tasksService.lock(this.id).pipe(take(1)).subscribe();
    this.modalRef = this.modalService.open(DescriptionModalComponent, {
      closeButton: false,
      width: '912px',
      data: {
        id: this.id,
        description: this.initialState?.description ?? '',
        descriptionKey: 'description',
        service: this.tasksService,
      },
    });

    this.modalRef.afterClosed$.pipe(untilDestroyed(this), take(1)).subscribe((callback?: ModalCallback) => {
      if (callback?.state === ModalState.Changed) {
        this.initialState = { ...callback.data };
        this.form.markAsPristine();
        this.refreshChanges.next(true);
        this.refreshResetValue.next(true);
      }
      this.tasksService.unlock(this.id).pipe(take(1)).subscribe();
    });
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
