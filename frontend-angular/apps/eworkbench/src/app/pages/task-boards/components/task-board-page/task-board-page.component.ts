/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpParams } from '@angular/common/http';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { ModalState } from '@app/enums/modal-state.enum';
import { ProjectSidebarItem } from '@app/enums/project-sidebar-item.enum';
import { PendingChangesModalComponent } from '@app/modules/shared/modals/pending-changes/pending-changes.component';
import { BackgroundModalComponent } from '@app/modules/task-board/components/modals/background/background.component';
import { BacklogModalComponent } from '@app/modules/task-board/components/modals/backlog/backlog.component';
import { NewTaskBoardModalComponent } from '@app/modules/task-board/components/modals/new/new.component';
import { TaskBoardComponent } from '@app/modules/task-board/components/task-board/task-board.component';
import { LeaveProjectModalComponent } from '@app/pages/projects/components/modals/leave/leave.component';
import { AuthService, PageTitleService, ProjectsService, TaskBoardsService, WebSocketService } from '@app/services';
import { UserService, UserStore } from '@app/stores/user';
import {
  Lock,
  ModalCallback,
  Privileges,
  PrivilegesData,
  Project,
  TaskBoard,
  TaskBoardFilter,
  TaskBoardPayload,
  User,
} from '@eworkbench/types';
import { DialogRef, DialogService } from '@ngneat/dialog';
import { FormBuilder, FormGroup } from '@ngneat/reactive-forms';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ToastrService } from 'ngx-toastr';
import { from, Observable, of, Subject } from 'rxjs';
import { catchError, debounceTime, map, mergeMap, skip, switchMap, take } from 'rxjs/operators';

interface FormTaskBoard {
  title: string | null;
  projects: string[];
}

@UntilDestroy()
@Component({
  templateUrl: './task-board-page.component.html',
  styleUrls: ['./task-board-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskBoardPageComponent implements OnInit, OnDestroy {
  public title = '';

  public id = this.route.snapshot.paramMap.get('id')!;

  public sidebarItem = ProjectSidebarItem.TaskBoards;

  public currentUser: User | null = null;

  @ViewChild(TaskBoardComponent, { static: true })
  public taskBoardC!: TaskBoardComponent;

  public initialState?: TaskBoard;

  public privileges?: Privileges;

  public lock: Lock | null = null;

  public modified = false;

  public showSidebar = false;

  public modalRef?: DialogRef;

  public styles: { [key: string]: string | undefined } = {};

  public projects: Project[] = [];

  public favoriteProjects: Project[] = [];

  public projectInput$ = new Subject<string>();

  public refreshChanges = new EventEmitter<boolean>();

  public refreshResetValue = new EventEmitter<boolean>();

  public setFilter = new EventEmitter<TaskBoardFilter>();

  public loading = true;

  public usersControl = this.fb.control<number | null>(null);

  public searchControl = this.fb.control<string | null>(null);

  public users: User[] = [];

  public usersInput$ = new Subject<string>();

  public newTaskBoardModalComponent = NewTaskBoardModalComponent;

  public form: FormGroup<FormTaskBoard> = this.fb.group({
    title: [null, [Validators.required]],
    projects: [[]],
  });

  public constructor(
    public readonly taskBoardsService: TaskBoardsService,
    private readonly fb: FormBuilder,
    private readonly translocoService: TranslocoService,
    private readonly modalService: DialogService,
    private readonly pageTitleService: PageTitleService,
    private readonly titleService: Title,
    private readonly cdr: ChangeDetectorRef,
    private readonly toastrService: ToastrService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly userService: UserService,
    private readonly projectsService: ProjectsService,
    private readonly authService: AuthService,
    private readonly websocketService: WebSocketService,
    private readonly userStore: UserStore
  ) {}

  public get f(): FormGroup<FormTaskBoard>['controls'] {
    /* istanbul ignore next */
    return this.form.controls;
  }

  public get lockUser(): { ownUser: boolean; user?: User | undefined | null } {
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

  private get taskBoard(): TaskBoardPayload {
    return {
      title: this.f.title.value!,
      projects: this.f.projects.value,
    };
  }

  public ngOnInit(): void {
    /* istanbul ignore next */
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;

    this.authService.user$.pipe(untilDestroyed(this)).subscribe(state => {
      this.currentUser = state.user;
    });

    this.websocketService.subscribe([{ model: 'kanbanboard', pk: this.id }]);
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

    this.initFormChanges();
    this.initSidebar();
    this.initSearch();
    this.initSearchInput();
  }

  public ngOnDestroy(): void {
    this.websocketService.unsubscribe();
  }

  public initDetails(privilegesData: PrivilegesData<TaskBoard>): void {
    if (privilegesData.data.projects.length) {
      from(privilegesData.data.projects)
        .pipe(
          mergeMap(id =>
            this.projectsService.get(id).pipe(
              untilDestroyed(this),
              catchError(() => {
                return of({ pk: id, name: this.translocoService.translate('formInput.unknownProject'), is_favourite: false } as Project);
              })
            )
          ),
          map(project => {
            this.projects = [...this.projects, project]
              .filter((value, index, array) => array.map(project => project.pk).indexOf(value.pk) === index)
              .sort((a, b) => Number(b.is_favourite) - Number(a.is_favourite));
          }),
          switchMap(() => of(privilegesData))
        )
        .subscribe();
    }
  }

  public initFormChanges(): void {
    this.form.valueChanges
      .pipe(
        untilDestroyed(this),
        debounceTime(500),
        switchMap(() => {
          this.cdr.markForCheck();
          if (!this.lock?.locked) {
            return this.taskBoardsService.lock(this.id);
          }

          return of([]);
        })
      )
      .subscribe();
  }

  public initSidebar(): void {
    this.route.params.subscribe(params => {
      if (params.projectId) {
        this.showSidebar = true;

        this.projectsService.get(params.projectId).subscribe(
          /* istanbul ignore next */ project => {
            this.projects = [...this.projects, project]
              .filter((value, index, array) => array.map(project => project.pk).indexOf(value.pk) === index)
              .sort((a, b) => Number(b.is_favourite) - Number(a.is_favourite));
          }
        );
      }
    });
  }

  public initSearch(): void {
    this.usersControl.value$.pipe(untilDestroyed(this), skip(1), debounceTime(500)).subscribe(
      /* istanbul ignore next */ user => {
        this.setFilter.next({ user, search: this.searchControl.value });
      }
    );

    this.searchControl.value$.pipe(untilDestroyed(this), skip(1), debounceTime(500)).subscribe(
      /* istanbul ignore next */ search => {
        this.setFilter.next({ user: this.usersControl.value, search });
      }
    );
  }

  public initSearchInput(): void {
    this.usersInput$
      .pipe(
        untilDestroyed(this),
        debounceTime(500),
        switchMap(/* istanbul ignore next */ input => (input ? this.userService.search(input) : of([])))
      )
      .subscribe(
        /* istanbul ignore next */ users => {
          if (users.length) {
            this.users = [...users];
            this.cdr.markForCheck();
          }
        }
      );

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

  public initPageTitle(): void {
    this.pageTitleService
      .get()
      .pipe(untilDestroyed(this))
      .subscribe(title => {
        this.titleService.setTitle(title);
      });
  }

  public onBoardChange(privilegesData: PrivilegesData<TaskBoard>): void {
    const board = privilegesData.data;
    const privileges = privilegesData.privileges;

    this.styles = {
      backgroundColor: board.background_color ? (board.download_background_image ? undefined : board.background_color) : undefined,
      backgroundImage: board.download_background_image ? `url('${board.download_background_image}')` : undefined,
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
      backgroundSize: 'cover',
    };

    this.initialState = { ...board };
    this.privileges = { ...privileges };
    this.title = board.display;

    this.form.patchValue({ title: board.title, projects: board.projects }, { emitEvent: false });

    if (!privileges.edit) {
      this.form.disable({ emitEvent: false });
    }

    this.loading = false;

    this.pageTitleService.set(board.display);

    this.initDetails(privilegesData);
    this.initPageTitle();
  }

  public insertColumn(): void {
    /* istanbul ignore next */
    this.taskBoardC.insertColumn();
  }

  public onSubmit(): void {
    if (this.loading) {
      return;
    }
    this.loading = true;

    this.taskBoardsService
      .patch(this.id, this.taskBoard)
      .pipe(untilDestroyed(this))
      .subscribe(
        /* istanbul ignore next */ () => {
          this.form.markAsPristine();
          this.refreshChanges.next(true);
          this.refreshResetValue.next(true);

          this.taskBoardC.loadData();
          this.loading = false;
          this.cdr.markForCheck();
          this.translocoService
            .selectTranslate('taskBoard.details.toastr.success')
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

  public canDeactivate(): Observable<boolean> {
    if (this.showSidebar) {
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

    return of(true);
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

  public openBackgroundModal(): void {
    /* istanbul ignore next */
    this.modalRef = this.modalService.open(BackgroundModalComponent, {
      closeButton: false,
      data: { taskBoard: this.initialState! },
    });
    /* istanbul ignore next */
    this.modalRef.afterClosed$.pipe(untilDestroyed(this), take(1)).subscribe((callback: ModalCallback) => this.onModalClose(callback));
  }

  public openBacklogModal(): void {
    /* istanbul ignore next */
    this.modalRef = this.modalService.open(BacklogModalComponent, {
      closeButton: false,
      width: '100%',
      data: { taskBoardId: this.initialState!.pk, column: this.initialState!.kanban_board_columns[0].pk! },
    });
    /* istanbul ignore next */
    this.modalRef.afterClosed$.pipe(untilDestroyed(this), take(1)).subscribe((callback: ModalCallback) => this.onModalClose(callback));
  }

  public onModalClose(callback?: ModalCallback): void {
    if (callback?.state === ModalState.Changed) {
      this.taskBoardC.loadData();
    }
  }
}
