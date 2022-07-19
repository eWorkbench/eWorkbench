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
import { DescriptionModalComponent } from '@app/modules/shared/modals/description/description.component';
import { PendingChangesModalComponent } from '@app/modules/shared/modals/pending-changes/pending-changes.component';
import { AuthService, PageTitleService, ProjectsService, TasksService, WebSocketService } from '@app/services';
import { UserStore } from '@app/stores/user';
import type {
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
import { FormBuilder, FormControl } from '@ngneat/reactive-forms';
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
  title: FormControl<string | null>;
  dateGroup: FormControl<DateGroup>;
  state: string | null;
  parentProject: string | null;
}

@UntilDestroy()
@Component({
  templateUrl: './project-page.component.html',
  styleUrls: ['./project-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectPageComponent implements OnInit, OnDestroy {
  @ViewChild(CommentsComponent)
  public comments!: CommentsComponent;

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

  public refreshLinkList = new EventEmitter<boolean>();

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

  public form = this.fb.group<FormProject>({
    title: this.fb.control(null, Validators.required),
    dateGroup: this.fb.control({ start: null, end: null, fullDay: true }),
    state: null,
    parentProject: null,
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

  public get f() {
    return this.form.controls;
  }

  public get descriptionTranslationKey(): string {
    return this.initialState?.description ? 'project.details.description.edit' : 'project.details.description.add';
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
      parent_project: this.f.parentProject.value,
      metadata: this.metadata!,
    };
  }

  public ngOnInit(): void {
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
        map(project => {
          const projectPermissionsList = project.current_users_project_permissions_list;
          const userStoreValue = this.userStore.getValue();

          this.form.patchValue(
            {
              title: project.name,
              dateGroup: { start: project.start_date, end: project.stop_date, fullDay: true },
              state: project.project_state,
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
        }),
        switchMap(project => {
          if (project.parent_project) {
            return this.projectsService
              .get(project.parent_project)
              .pipe(
                untilDestroyed(this),
                catchError(() =>
                  of({
                    pk: project.parent_project,
                    name: this.translocoService.translate('formInput.unknownProject'),
                    is_favourite: false,
                  } as Project)
                )
              )
              .pipe(
                map(project => {
                  this.parentProject = [...this.parentProject, project]
                    .filter((value, index, array) => array.map(project => project.pk).indexOf(value.pk) === index)
                    .sort((a, b) => Number(b.is_favourite) - Number(a.is_favourite));
                  this.cdr.markForCheck();
                }),
                switchMap(() => of(project))
              );
          }

          return of(project);
        })
      )
      .subscribe(
        project => {
          this.title = project.display;
          void this.pageTitleService.set(project.display);

          this.initialState = { ...project };

          this.loading = false;
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

  public initSearchInput(): void {
    this.projectInput$
      .pipe(
        untilDestroyed(this),
        debounceTime(500),
        switchMap(input => (input ? this.projectsService.search(input) : of([...this.favoriteProjects])))
      )
      .subscribe(projects => {
        this.parentProject = [...projects].sort((a, b) => Number(b.is_favourite) - Number(a.is_favourite));
        this.cdr.markForCheck();
      });

    this.projectsService
      .getList(new HttpParams().set('favourite', 'true'))
      .pipe(untilDestroyed(this))
      .subscribe(projects => {
        if (projects.data.length) {
          this.favoriteProjects = [...projects.data];
          this.parentProject = [...this.parentProject, ...this.favoriteProjects]
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

  public onSubmit(): void {
    if (this.loading) {
      return;
    }
    this.loading = true;

    this.projectsService
      .patch(this.id, this.project)
      .pipe(
        untilDestroyed(this),
        map(project => {
          this.title = project.display;
          void this.pageTitleService.set(project.display);

          this.initialState = { ...project };
          this.form.markAsPristine();
          this.refreshVersions.next(true);
          this.refreshChanges.next(true);
          this.refreshMetadata.next(true);
          this.refreshLinkList.next(true);
        })
      )
      .subscribe(
        () => {
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
        () => {
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

  public onOpenNewSubprojectModal(): void {
    this.modalRef = this.modalService.open(NewProjectModalComponent, {
      closeButton: false,
      data: {
        initialState: {
          parent_project: this.initialState?.pk,
          project_state: 'INIT',
        },
        disableProjectField: true,
        newSubproject: true,
      },
    });

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

    this.modalRef.afterClosed$.pipe(untilDestroyed(this), take(1)).subscribe((callback: ModalCallback) => this.onModalClose(callback));
  }

  public onOpenNewCommentModal(): void {
    this.modalRef = this.modalService.open(NewCommentModalComponent, {
      closeButton: false,
      width: '912px',
      data: {
        id: this.id,
        contentType: this.initialState?.content_type,
        service: this.projectsService,
      },
    });

    this.modalRef.afterClosed$.pipe(untilDestroyed(this), take(1)).subscribe((callback: ModalCallback) => {
      if (callback.state === ModalState.Changed) {
        this.comments.loadComments();
      }
    });
  }

  public onOpenDescriptionModal(): void {
    this.modalRef = this.modalService.open(DescriptionModalComponent, {
      closeButton: false,
      width: '912px',
      data: {
        id: this.id,
        description: this.initialState?.description ?? '',
        descriptionKey: 'description',
        service: this.projectsService,
      },
    });

    this.modalRef.afterClosed$.pipe(untilDestroyed(this), take(1)).subscribe((callback?: ModalCallback) => {
      if (callback?.state === ModalState.Changed) {
        this.initialState = { ...callback.data };
        this.form.markAsPristine();
        this.refreshChanges.next(true);
        this.refreshResetValue.next(true);
        this.cdr.markForCheck();
      }
    });
  }

  public onModalClose(callback?: ModalCallback): void {
    if (callback?.navigate) {
      void this.router.navigate(callback.navigate);
    }
  }

  public onVersionChanged(): void {
    this.initDetails();
    this.refreshVersions.next(true);
    this.refreshChanges.next(true);
    this.refreshMetadata.next(true);
    this.refreshLinkList.next(true);
  }

  public onRefreshLinkList(): void {
    this.refreshLinkList.next(true);
  }

  public onUpdateMetadata(metadata: Metadata[]): void {
    this.metadata = metadata;
  }
}
