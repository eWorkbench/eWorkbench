/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpErrorResponse, HttpParams } from '@angular/common/http';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, OnDestroy, OnInit } from '@angular/core';
import { Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { ProjectSidebarItem } from '@app/enums/project-sidebar-item.enum';
import { PendingChangesModalComponent } from '@app/modules/shared/modals/pending-changes/pending-changes.component';
import { AuthService, PageTitleService, ProjectsService, TasksService, WebSocketService } from '@app/services';
import { UserStore } from '@app/stores/user';
import {
  DateGroup,
  DropdownElement,
  Metadata,
  ModalCallback,
  Privileges,
  Project,
  ProjectPayload,
  ProjectPrivileges,
  User,
} from '@eworkbench/types';
import { DialogRef, DialogService } from '@ngneat/dialog';
import { FormBuilder, FormGroup } from '@ngneat/reactive-forms';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { set } from 'date-fns';
import { ToastrService } from 'ngx-toastr';
import { Observable, of, Subject } from 'rxjs';
import { catchError, debounceTime, map, switchMap, take } from 'rxjs/operators';
import { LeaveProjectModalComponent } from '../modals/leave/leave.component';
import { NewProjectModalComponent } from '../modals/new/new.component';
import { StateTimelineModalComponent } from '../modals/state-timeline/state-timeline.component';

interface FormProject {
  title: string | null;
  dateGroup: DateGroup;
  state: string | null;
  description: string | null;
  parentProject: string | null;
}

@UntilDestroy()
@Component({
  templateUrl: './project-page.component.html',
  styleUrls: ['./project-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectPageComponent implements OnInit, OnDestroy {
  public title?: string;

  public id = this.route.snapshot.paramMap.get('projectId')!;

  public sidebarItem = ProjectSidebarItem.Overview;

  public currentUser: User | null = null;

  public initialState?: Project;

  public metadata?: Metadata[];

  public loading = false;

  public newModalComponent = NewProjectModalComponent;

  public refreshChanges = new EventEmitter<boolean>();

  public refreshVersions = new EventEmitter<boolean>();

  public refreshResetValue = new EventEmitter<boolean>();

  public refreshMetadata = new EventEmitter<boolean>();

  public assignees: User[] = [];

  public assigneesInput$ = new Subject<string>();

  public parentProject: Project[] = [];

  public favoriteProjects: Project[] = [];

  public projectInput$ = new Subject<string>();

  public stateItems: DropdownElement[] = [];

  public modalRef?: DialogRef;

  public privileges: Privileges = {
    fullAccess: false,
    view: false,
    edit: false,
    delete: false,
    trash: false,
    restore: false,
  };

  public projectPrivileges: ProjectPrivileges = {
    editRoles: false,
    deleteRoles: false,
    addRoles: false,
    viewRoles: false,
    inviteExternalUsers: false,
  };

  public form: FormGroup<FormProject> = this.fb.group({
    title: [null, [Validators.required]],
    dateGroup: [{ start: null, end: null, fullDay: true }],
    state: [null],
    description: [null],
    parentProject: [null],
  });

  public constructor(
    public readonly projectsService: ProjectsService,
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
    private readonly pageTitleService: PageTitleService,
    private readonly titleService: Title,
    private readonly userStore: UserStore
  ) {}

  public get f(): FormGroup<FormProject>['controls'] {
    /* istanbul ignore next */
    return this.form.controls;
  }

  private get project(): ProjectPayload {
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
      name: this.f.title.value!,
      start_date: dateTimeStart,
      stop_date: dateTimeEnd,
      project_state: (this.f.state.value as Project['project_state'] | null) ?? 'INIT',
      description: this.f.description.value ?? '',
      parent_project: this.f.parentProject.value,
    };
  }

  public ngOnInit(): void {
    /* istanbul ignore next */
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;

    this.authService.user$.pipe(untilDestroyed(this)).subscribe(state => {
      this.currentUser = state.user;
    });

    this.initTranslations();
    this.initDetails();
    this.initSearchInput();
    this.initPageTitle();
  }

  public ngOnDestroy(): void {
    this.websocketService.unsubscribe();
  }

  public initTranslations(): void {
    this.translocoService
      .selectTranslateObject('projects.state')
      .pipe(untilDestroyed(this))
      .subscribe(state => {
        this.stateItems = [
          { label: state.new, value: 'INIT' },
          { label: state.inProgress, value: 'START' },
          { label: state.done, value: 'FIN' },
          { label: state.paused, value: 'PAUSE' },
          { label: state.canceled, value: 'CANCE' },
          { label: state.deleted, value: 'DEL' },
        ];
      });
  }

  public initDetails(): void {
    this.loading = true;

    this.projectsService
      .get(this.id)
      .pipe(
        untilDestroyed(this),
        map(
          /* istanbul ignore next */ project => {
            const projectPermissionsList = project.current_users_project_permissions_list;
            const userStoreValue = this.userStore.getValue();

            this.form.patchValue(
              {
                title: project.name,
                dateGroup: { start: project.start_date, end: project.stop_date, fullDay: true },
                state: project.project_state,
                description: project.description!,
                parentProject: project.parent_project,
              },
              { emitEvent: false }
            );

            if (projectPermissionsList.includes('projects.change_project')) {
              this.privileges = {
                fullAccess: true,
                view: true,
                edit: true,
                delete: true,
                trash: true,
                restore: true,
              };
            } else {
              this.form.disable({ emitEvent: false });
            }

            this.projectPrivileges = {
              editRoles: projectPermissionsList.includes('projects.change_projectroleuserassignment'),
              deleteRoles: projectPermissionsList.includes('projects.delete_projectroleuserassignment'),
              addRoles: projectPermissionsList.includes('projects.add_projectroleuserassignment'),
              viewRoles: projectPermissionsList.includes('projects.view_projectroleuserassignment'),
              inviteExternalUsers: Boolean(userStoreValue.user?.permissions?.includes('projects.invite_external_user')),
            };

            return project;
          }
        ),
        switchMap(
          /* istanbul ignore next */ project => {
            if (project.parent_project) {
              return this.projectsService
                .get(project.parent_project)
                .pipe(
                  untilDestroyed(this),
                  catchError(() => {
                    return of({
                      pk: project.parent_project,
                      name: this.translocoService.translate('formInput.unknownProject'),
                      is_favourite: false,
                    } as Project);
                  })
                )
                .pipe(
                  map(project => {
                    this.parentProject = [...this.parentProject, project]
                      .filter((value, index, array) => array.map(project => project.pk).indexOf(value.pk) === index)
                      .sort((a, b) => Number(b.is_favourite) - Number(a.is_favourite));
                  }),
                  switchMap(() => of(project))
                );
            }

            return of(project);
          }
        )
      )
      .subscribe(
        /* istanbul ignore next */ project => {
          this.title = project.display;
          this.pageTitleService.set(project.display);

          this.initialState = { ...project };

          this.loading = false;
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

  public initSearchInput(): void {
    this.projectInput$
      .pipe(
        untilDestroyed(this),
        debounceTime(500),
        switchMap(/* istanbul ignore next */ input => (input ? this.projectsService.search(input) : of([...this.favoriteProjects])))
      )
      .subscribe(
        /* istanbul ignore next */ projects => {
          this.parentProject = [...projects].sort((a, b) => Number(b.is_favourite) - Number(a.is_favourite));
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
            this.parentProject = [...this.parentProject, ...this.favoriteProjects]
              .filter((value, index, array) => array.map(project => project.pk).indexOf(value.pk) === index)
              .sort((a, b) => Number(b.is_favourite) - Number(a.is_favourite));
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

  public onSubmit(): void {
    if (this.loading) {
      return;
    }
    this.loading = true;

    this.projectsService
      .patch(this.id, this.project)
      .pipe(
        untilDestroyed(this),
        map(
          /* istanbul ignore next */ project => {
            this.title = project.display;
            this.pageTitleService.set(project.display);

            this.initialState = { ...project };
            this.form.markAsPristine();
            this.refreshVersions.next(true);
            this.refreshChanges.next(true);
            this.refreshMetadata.next(true);
          }
        )
      )
      .subscribe(
        /* istanbul ignore next */ () => {
          this.loading = false;
          this.refreshResetValue.next(true);
          this.cdr.markForCheck();
          this.translocoService
            .selectTranslate('project.details.toastr.success')
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

  public canDeactivate(): Observable<boolean> {
    const userStoreValue = this.userStore.getValue();
    const userSetting = 'SkipDialog-LeaveProject';

    /* istanbul ignore next */
    const skipLeaveDialog = Boolean(userStoreValue.user?.userprofile.ui_settings?.confirm_dialog?.[userSetting]);

    if (skipLeaveDialog) {
      return of(true);
    }

    this.modalRef = this.modalService.open(LeaveProjectModalComponent, {
      closeButton: false,
    });
    /* istanbul ignore next */
    return this.modalRef.afterClosed$.pipe(
      untilDestroyed(this),
      take(1),
      map(val => Boolean(val))
    );
  }

  public onOpenNewSubProjectModal(): void {
    this.modalRef = this.modalService.open(NewProjectModalComponent, {
      closeButton: false,
      data: {
        initialState: {
          parent_project: this.initialState?.pk,
          project_state: 'INIT',
        },
        disableProjectField: true,
      },
    });
    /* istanbul ignore next */
    this.modalRef.afterClosed$.pipe(untilDestroyed(this), take(1)).subscribe((callback: ModalCallback) => this.onModalClose(callback));
  }

  public onOpenStateTimelineModal(): void {
    this.modalRef = this.modalService.open(StateTimelineModalComponent, {
      closeButton: false,
      width: '100%',
      data: {
        id: this.id,
      },
    });

    /* istanbul ignore next */
    this.modalRef.afterClosed$.pipe(untilDestroyed(this), take(1)).subscribe((callback: ModalCallback) => this.onModalClose(callback));
  }

  public onModalClose(callback?: ModalCallback): void {
    if (callback?.navigate) {
      this.router.navigate(callback.navigate);
    }
  }

  public onVersionChanged(): void {
    this.initDetails();
    this.refreshVersions.next(true);
    this.refreshChanges.next(true);
    this.refreshMetadata.next(true);
  }

  public onUpdateMetadata(metadata: Metadata[]): void {
    this.metadata = metadata;
  }
}
