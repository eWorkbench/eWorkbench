/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpParams } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Inject,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { ModalState } from '@app/enums/modal-state.enum';
import { ProjectSidebarItem } from '@app/enums/project-sidebar-item.enum';
import { CommentsComponent } from '@app/modules/comment/components/comments/comments.component';
import { NewCommentModalComponent } from '@app/modules/comment/components/modals/new/new.component';
import { HEADER_TOP_OFFSET } from '@app/modules/header/tokens/header-top-offset.token';
import { DescriptionModalComponent } from '@app/modules/shared/modals/description/description.component';
import { PendingChangesModalComponent } from '@app/modules/shared/modals/pending-changes/pending-changes.component';
import { BacklogModalComponent } from '@app/modules/task-board/components/modals/backlog/backlog.component';
import { NewTaskBoardColumnModalComponent } from '@app/modules/task-board/components/modals/new-column/new-column.component';
import { NewTaskBoardModalComponent } from '@app/modules/task-board/components/modals/new/new.component';
import { SettingsModalComponent } from '@app/modules/task-board/components/modals/settings/settings.component';
import { TaskBoardComponent } from '@app/modules/task-board/components/task-board/task-board.component';
import { LeaveProjectModalComponent } from '@app/pages/projects/components/modals/leave/leave.component';
import { AuthService, PageTitleService, ProjectsService, TaskBoardsService, WebSocketService } from '@app/services';
import { UserService, UserStore } from '@app/stores/user';
import type {
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
import { FormBuilder, FormControl } from '@ngneat/reactive-forms';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ToastrService } from 'ngx-toastr';
import { BehaviorSubject, from, Observable, of, Subject } from 'rxjs';
import { catchError, debounceTime, map, mergeMap, skip, switchMap, take } from 'rxjs/operators';

interface FormTaskBoard {
  title: FormControl<string | null>;
  projects: FormControl<string[]>;
}

@UntilDestroy()
@Component({
  templateUrl: './task-board-page.component.html',
  styleUrls: ['./task-board-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskBoardPageComponent implements OnInit, OnDestroy {
  @ViewChild(CommentsComponent)
  public comments!: CommentsComponent;

  @ViewChild('taskboardContainer')
  public taskboardContainer?: ElementRef<HTMLElement>;

  @ViewChild('taskboardScrollbar')
  public taskboardScrollbar?: ElementRef<HTMLElement>;

  @ViewChild('scrollbarContent')
  public scrollbarContent?: ElementRef<HTMLElement>;

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

  public refreshChanges = new EventEmitter<boolean>();

  public refreshResetValue = new EventEmitter<boolean>();

  public refreshLinkList = new EventEmitter<boolean>();

  public setFilter = new EventEmitter<TaskBoardFilter>();

  public loading = true;

  public projectsControl = this.fb.control<string | null>(null);

  public usersControl = this.fb.control<number | null>(null);

  public assigneesControl = this.fb.control<number | null>(null);

  public searchControl = this.fb.control<string | null>(null);

  public veryHighCheckbox = this.fb.control<boolean>(true);

  public highCheckbox = this.fb.control<boolean>(true);

  public normalCheckbox = this.fb.control<boolean>(true);

  public lowCheckbox = this.fb.control<boolean>(true);

  public veryLowCheckbox = this.fb.control<boolean>(true);

  public newCheckbox = this.fb.control<boolean>(true);

  public progressCheckbox = this.fb.control<boolean>(true);

  public doneCheckbox = this.fb.control<boolean>(true);

  public favoritesControl = this.fb.control<boolean | null>(null);

  public users: User[] = [];

  public assignees: User[] = [];

  public usersInput$ = new Subject<string>();

  public assigneesInput$ = new Subject<string>();

  public projects: Project[] = [];

  public favoriteProjects: Project[] = [];

  public projectsInput$ = new Subject<string>();

  public newTaskBoardModalComponent = NewTaskBoardModalComponent;

  public showUserFilter = false;

  public showAssigneesFilter = false;

  public savedFilters = false;

  public userSettings = {};

  private stateFilters: string[] = ['NEW', 'PROG', 'DONE'];

  private priorityFilters: string[] = ['1', '2', '3', '4', '5'];

  public form = this.fb.group<FormTaskBoard>({
    title: this.fb.control(null, Validators.required),
    projects: this.fb.control([]),
  });

  @HostListener('window:resize')
  public onResize() {
    this.handleTaskboardScrollOnResize();
  }

  public constructor(
    @Inject(HEADER_TOP_OFFSET) public readonly headerTopOffset: BehaviorSubject<number>,
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
    return this.initialState?.description ? 'taskBoard.details.description.edit' : 'taskBoard.details.description.add';
  }

  private get taskBoard(): TaskBoardPayload {
    return {
      title: this.f.title.value!,
      projects: this.f.projects.value,
    };
  }

  public get filtersChanged(): boolean {
    /* eslint-disable */
    return Boolean(
      this.projectsControl.value ||
        this.usersControl.value ||
        this.assigneesControl.value ||
        this.searchControl.value ||
        this.veryHighCheckbox.dirty ||
        this.highCheckbox.dirty ||
        this.normalCheckbox.dirty ||
        this.lowCheckbox.dirty ||
        this.veryLowCheckbox.dirty ||
        this.newCheckbox.dirty ||
        this.progressCheckbox.dirty ||
        this.doneCheckbox.dirty ||
        this.favoritesControl.value
    );
    /* eslint-enable */
  }

  public get getFilterSelectedUser(): User | undefined {
    return this.users.find(user => user.pk === this.usersControl.value);
  }

  public ngOnInit(): void {
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;

    this.authService.user$.pipe(untilDestroyed(this)).subscribe(state => {
      this.currentUser = state.user;
    });

    this.websocketService.subscribe([{ model: 'kanbanboard', pk: this.id }]);
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

    this.taskBoardsService
      .getFilterSettings(this.id)
      .pipe(untilDestroyed(this), take(1))
      .subscribe(([filters]) => {
        if (filters?.settings.active) {
          this.savedFilters = true;
        }

        if (filters?.settings.active) {
          this.searchControl.setValue(filters.settings.search);
        }
      });

    this.initFormChanges();
    this.initSidebar();
    this.initSearch();
    this.initSearchInput();
    this.initUserSettings();
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
              catchError(() =>
                of({ pk: id, name: this.translocoService.translate('formInput.unknownProject'), is_favourite: false } as Project)
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
        )
        .subscribe();
    }
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

        this.projectsService.get(params.projectId).subscribe(project => {
          this.projects = [...this.projects, project]
            .filter((value, index, array) => array.map(project => project.pk).indexOf(value.pk) === index)
            .sort((a, b) => Number(b.is_favourite) - Number(a.is_favourite));
          this.cdr.markForCheck();
        });
      }
    });
  }

  public initSearch(): void {
    this.usersControl.value$.pipe(untilDestroyed(this), skip(1), debounceTime(500)).subscribe(user => {
      this.setFilter.next({
        assignee: this.assigneesControl.value,
        user,
        project: this.projectsControl.value,
        search: this.searchControl.value,
        priority: this.priorityFilters,
        state: this.stateFilters,
        favorite: this.favoritesControl.value,
      });
    });

    this.assigneesControl.value$.pipe(untilDestroyed(this), skip(1), debounceTime(500)).subscribe(assignee => {
      this.setFilter.next({
        assignee,
        user: this.usersControl.value,
        project: this.projectsControl.value,
        search: this.searchControl.value,
        priority: this.priorityFilters,
        state: this.stateFilters,
        favorite: this.favoritesControl.value,
      });
    });

    this.projectsControl.value$.pipe(untilDestroyed(this), skip(1), debounceTime(500)).subscribe(project => {
      this.setFilter.next({
        assignee: this.assigneesControl.value,
        user: this.usersControl.value,
        project,
        search: this.searchControl.value,
        priority: this.priorityFilters,
        state: this.stateFilters,
        favorite: this.favoritesControl.value,
      });

      if (this.savedFilters) {
        this.onSaveFilters(true);
      }
    });

    this.searchControl.value$.pipe(untilDestroyed(this), skip(1), debounceTime(500)).subscribe(search => {
      this.setFilter.next({
        assignee: this.assigneesControl.value,
        user: this.usersControl.value,
        project: this.projectsControl.value,
        search,
        priority: this.priorityFilters,
        state: this.stateFilters,
        favorite: this.favoritesControl.value,
      });

      if (this.savedFilters) {
        this.onSaveFilters(true);
      }
    });

    this.veryHighCheckbox.value$.pipe(untilDestroyed(this), skip(1), debounceTime(500)).subscribe(value => {
      const params = this.priorityFilters.filter(params => params !== '1');

      if (value) {
        this.priorityFilters = [...params, '1'];
        this.setFilter.next({
          assignee: this.assigneesControl.value,
          user: this.usersControl.value,
          project: this.projectsControl.value,
          search: this.searchControl.value,
          priority: this.priorityFilters,
          state: this.stateFilters,
          favorite: this.favoritesControl.value,
        });
      } else {
        this.priorityFilters = [...params];
        this.setFilter.next({
          assignee: this.assigneesControl.value,
          user: this.usersControl.value,
          project: this.projectsControl.value,
          search: this.searchControl.value,
          priority: this.priorityFilters,
          state: this.stateFilters,
          favorite: this.favoritesControl.value,
        });
      }

      if (this.savedFilters) {
        this.onSaveFilters(true);
      }
    });

    this.highCheckbox.value$.pipe(untilDestroyed(this), skip(1), debounceTime(500)).subscribe(value => {
      const params = this.priorityFilters.filter(params => params !== '2');

      if (value) {
        this.priorityFilters = [...params, '2'];
        this.setFilter.next({
          assignee: this.assigneesControl.value,
          user: this.usersControl.value,
          project: this.projectsControl.value,
          search: this.searchControl.value,
          priority: this.priorityFilters,
          state: this.stateFilters,
          favorite: this.favoritesControl.value,
        });
      } else {
        this.priorityFilters = [...params];
        this.setFilter.next({
          assignee: this.assigneesControl.value,
          user: this.usersControl.value,
          project: this.projectsControl.value,
          search: this.searchControl.value,
          priority: this.priorityFilters,
          state: this.stateFilters,
          favorite: this.favoritesControl.value,
        });
      }

      if (this.savedFilters) {
        this.onSaveFilters(true);
      }
    });

    this.normalCheckbox.value$.pipe(untilDestroyed(this), skip(1), debounceTime(500)).subscribe(value => {
      const params = this.priorityFilters.filter(params => params !== '3');

      if (value) {
        this.priorityFilters = [...params, '3'];
        this.setFilter.next({
          assignee: this.assigneesControl.value,
          user: this.usersControl.value,
          project: this.projectsControl.value,
          search: this.searchControl.value,
          priority: this.priorityFilters,
          state: this.stateFilters,
          favorite: this.favoritesControl.value,
        });
      } else {
        this.priorityFilters = [...params];
        this.setFilter.next({
          assignee: this.assigneesControl.value,
          user: this.usersControl.value,
          project: this.projectsControl.value,
          search: this.searchControl.value,
          priority: this.priorityFilters,
          state: this.stateFilters,
          favorite: this.favoritesControl.value,
        });
      }

      if (this.savedFilters) {
        this.onSaveFilters(true);
      }
    });

    this.lowCheckbox.value$.pipe(untilDestroyed(this), skip(1), debounceTime(500)).subscribe(value => {
      const params = this.priorityFilters.filter(params => params !== '4');

      if (value) {
        this.priorityFilters = [...params, '4'];
        this.setFilter.next({
          assignee: this.assigneesControl.value,
          user: this.usersControl.value,
          project: this.projectsControl.value,
          search: this.searchControl.value,
          priority: this.priorityFilters,
          state: this.stateFilters,
          favorite: this.favoritesControl.value,
        });
      } else {
        this.priorityFilters = [...params];
        this.setFilter.next({
          assignee: this.assigneesControl.value,
          user: this.usersControl.value,
          project: this.projectsControl.value,
          search: this.searchControl.value,
          priority: this.priorityFilters,
          state: this.stateFilters,
          favorite: this.favoritesControl.value,
        });
      }

      if (this.savedFilters) {
        this.onSaveFilters(true);
      }
    });

    this.veryLowCheckbox.value$.pipe(untilDestroyed(this), skip(1), debounceTime(500)).subscribe(value => {
      const params = this.priorityFilters.filter(params => params !== '5');

      if (value) {
        this.priorityFilters = [...params, '5'];
        this.setFilter.next({
          assignee: this.assigneesControl.value,
          user: this.usersControl.value,
          project: this.projectsControl.value,
          search: this.searchControl.value,
          priority: this.priorityFilters,
          state: this.stateFilters,
          favorite: this.favoritesControl.value,
        });
      } else {
        this.priorityFilters = [...params];
        this.setFilter.next({
          assignee: this.assigneesControl.value,
          user: this.usersControl.value,
          project: this.projectsControl.value,
          search: this.searchControl.value,
          priority: this.priorityFilters,
          state: this.stateFilters,
          favorite: this.favoritesControl.value,
        });
      }

      if (this.savedFilters) {
        this.onSaveFilters(true);
      }
    });

    this.newCheckbox.value$.pipe(untilDestroyed(this), skip(1), debounceTime(500)).subscribe(value => {
      const params = this.stateFilters.filter(params => params !== 'NEW');

      if (value) {
        this.stateFilters = [...params, 'NEW'];
        this.setFilter.next({
          assignee: this.assigneesControl.value,
          user: this.usersControl.value,
          project: this.projectsControl.value,
          search: this.searchControl.value,
          priority: this.priorityFilters,
          state: this.stateFilters,
          favorite: this.favoritesControl.value,
        });
      } else {
        this.stateFilters = [...params];
        this.setFilter.next({
          assignee: this.assigneesControl.value,
          user: this.usersControl.value,
          project: this.projectsControl.value,
          search: this.searchControl.value,
          priority: this.priorityFilters,
          state: this.stateFilters,
          favorite: this.favoritesControl.value,
        });
      }

      if (this.savedFilters) {
        this.onSaveFilters(true);
      }
    });

    this.progressCheckbox.value$.pipe(untilDestroyed(this), skip(1), debounceTime(500)).subscribe(value => {
      const params = this.stateFilters.filter(params => params !== 'PROG');

      if (value) {
        this.stateFilters = [...params, 'PROG'];
        this.setFilter.next({
          assignee: this.assigneesControl.value,
          user: this.usersControl.value,
          project: this.projectsControl.value,
          search: this.searchControl.value,
          priority: this.priorityFilters,
          state: this.stateFilters,
          favorite: this.favoritesControl.value,
        });
      } else {
        this.stateFilters = [...params];
        this.setFilter.next({
          assignee: this.assigneesControl.value,
          user: this.usersControl.value,
          project: this.projectsControl.value,
          search: this.searchControl.value,
          priority: this.priorityFilters,
          state: this.stateFilters,
          favorite: this.favoritesControl.value,
        });
      }

      if (this.savedFilters) {
        this.onSaveFilters(true);
      }
    });

    this.doneCheckbox.value$.pipe(untilDestroyed(this), skip(1), debounceTime(500)).subscribe(value => {
      const params = this.stateFilters.filter(params => params !== 'DONE');

      if (value) {
        this.stateFilters = [...params, 'DONE'];
        this.setFilter.next({
          assignee: this.assigneesControl.value,
          user: this.usersControl.value,
          project: this.projectsControl.value,
          search: this.searchControl.value,
          priority: this.priorityFilters,
          state: this.stateFilters,
          favorite: this.favoritesControl.value,
        });
      } else {
        this.stateFilters = [...params];
        this.setFilter.next({
          assignee: this.assigneesControl.value,
          user: this.usersControl.value,
          project: this.projectsControl.value,
          search: this.searchControl.value,
          priority: this.priorityFilters,
          state: this.stateFilters,
          favorite: this.favoritesControl.value,
        });
      }

      if (this.savedFilters) {
        this.onSaveFilters(true);
      }
    });

    this.favoritesControl.value$.pipe(untilDestroyed(this), skip(1), debounceTime(500)).subscribe(value => {
      if (value) {
        this.setFilter.next({
          assignee: this.assigneesControl.value,
          user: this.usersControl.value,
          project: this.projectsControl.value,
          search: this.searchControl.value,
          priority: this.priorityFilters,
          state: this.stateFilters,
          favorite: value,
        });
      } else {
        this.setFilter.next({
          assignee: this.assigneesControl.value,
          user: this.usersControl.value,
          project: this.projectsControl.value,
          search: this.searchControl.value,
          priority: this.priorityFilters,
          state: this.stateFilters,
          favorite: null,
        });
      }

      if (this.savedFilters) {
        this.onSaveFilters(true);
      }
    });
  }

  public initSearchInput(): void {
    this.usersInput$
      .pipe(
        untilDestroyed(this),
        debounceTime(500),
        switchMap(input => (input ? this.userService.search(input) : of([])))
      )
      .subscribe(users => {
        if (users.length) {
          this.users = [...users];
          this.cdr.markForCheck();
        }
      });

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

    this.projectsInput$
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

  public initUserSettings(): void {
    this.taskBoardsService
      .getUserSettings(this.id)
      .pipe(untilDestroyed(this), take(1))
      .subscribe(([settings]) => {
        if (settings) {
          this.userSettings = { ...settings };
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

  public initTaskboardScroll(): void {
    setTimeout(() => {
      if (this.taskboardContainer && this.taskboardScrollbar && this.scrollbarContent) {
        this.taskboardScrollbar.nativeElement.style.width = `${this.taskboardContainer.nativeElement.offsetWidth}px`;
        this.scrollbarContent.nativeElement.style.width = `${this.taskboardContainer.nativeElement.scrollWidth}px`;
      }
    }, 1);
    setTimeout(() => {
      this.taskboardScrollbar?.nativeElement.scroll({
        left: this.taskboardScrollbar.nativeElement.scrollLeft - 1,
        behavior: 'smooth',
      });
    }, 1);
  }

  public handleTaskboardScrollOnResize(): void {
    if (this.taskboardScrollbar && this.scrollbarContent) {
      this.taskboardScrollbar.nativeElement.style.width = '0px';
      this.scrollbarContent.nativeElement.style.width = '0px';
    }
    this.initTaskboardScroll();
  }

  public onTaskboardScroll(event: any): void {
    if (this.taskboardContainer) {
      this.taskboardContainer.nativeElement.scrollLeft = event.target.scrollLeft;
    }
  }

  public onTaskboardContainerScroll(event: any): void {
    if (this.taskboardScrollbar) {
      this.taskboardScrollbar.nativeElement.scrollLeft = event.target.scrollLeft;
    }
  }

  public onToggleFilterSidebar(): void {
    this.handleTaskboardScrollOnResize();
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
      minHeight: 'calc(100% - 95px)',
    };

    this.initialState = { ...board };
    this.privileges = { ...privileges };
    this.title = board.display;

    this.form.patchValue(
      {
        title: board.title,
        projects: board.projects,
      },
      { emitEvent: false }
    );

    if (!privileges.edit) {
      this.form.disable({ emitEvent: false });
    }

    this.loading = false;

    void this.pageTitleService.set(board.display);

    this.initDetails(privilegesData);
    this.initUserSettings();
    this.initPageTitle();
  }

  public openNewColumnModal(): void {
    this.modalRef = this.modalService.open(NewTaskBoardColumnModalComponent, {
      closeButton: false,
    });

    this.modalRef.afterClosed$
      .pipe(untilDestroyed(this), take(1))
      .subscribe((callback: ModalCallback) => this.onNewColumnModalClose(callback));
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
        () => {
          this.form.markAsPristine();
          this.refreshChanges.next(true);
          this.refreshLinkList.next(true);
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

  public onSaveFilters(save: boolean): void {
    this.savedFilters = save;
    if (save) {
      this.taskBoardsService
        .getFilterSettings(this.id)
        .pipe(
          untilDestroyed(this),
          take(1),
          switchMap(([filters]) =>
            this.taskBoardsService.upsertFilterSettings(
              this.id,
              {
                ...filters,
                kanban_board_pk: this.id,
                settings: {
                  active: true,
                  projects: this.projectsControl.value,
                  search: this.searchControl.value,
                },
              },
              filters?.pk
            )
          )
        )
        .subscribe();
    } else {
      this.taskBoardsService
        .getFilterSettings(this.id)
        .pipe(
          untilDestroyed(this),
          take(1),
          switchMap(([filters]) =>
            this.taskBoardsService.upsertFilterSettings(
              this.id,
              {
                ...filters,
                kanban_board_pk: this.id,
                settings: {
                  active: false,
                },
              },
              filters?.pk
            )
          )
        )
        .subscribe();
    }
  }

  public onUserFilterRadioAnyone(): void {
    this.showUserFilter = false;
    this.users = [];
  }

  public onUserFilterRadioAnyoneAssignees(): void {
    this.showUserFilter = false;
    this.assignees = [];
  }

  public onUserFilterRadioMyself(checked: boolean): void {
    if (checked && this.currentUser) {
      this.showUserFilter = false;
      this.users = [this.currentUser];
    }
  }

  public onUserFilterRadioMyselfAssignees(checked: boolean): void {
    if (checked && this.currentUser) {
      this.showAssigneesFilter = false;
      this.assignees = [this.currentUser];
    }
  }

  public onResetFilters(): void {
    this.priorityFilters = ['1', '2', '3', '4', '5'];
    this.stateFilters = ['NEW', 'PROG', 'DONE'];

    this.projectsControl.setValue(null, { emitEvent: false });
    this.projects = [];

    this.usersControl.setValue(null, { emitEvent: false });
    this.users = [];

    this.assigneesControl.setValue(null, { emitEvent: false });
    this.assignees = [];

    this.searchControl.setValue(null, { emitEvent: false });

    this.veryHighCheckbox.setValue(true, { emitEvent: false });
    this.veryHighCheckbox.markAsPristine();

    this.highCheckbox.setValue(true, { emitEvent: false });
    this.highCheckbox.markAsPristine();

    this.normalCheckbox.setValue(false, { emitEvent: false });
    this.normalCheckbox.markAsPristine();

    this.lowCheckbox.setValue(true, { emitEvent: false });
    this.lowCheckbox.markAsPristine();

    this.veryLowCheckbox.setValue(false, { emitEvent: false });
    this.veryLowCheckbox.markAsPristine();

    this.newCheckbox.setValue(true, { emitEvent: false });
    this.newCheckbox.markAsPristine();

    this.progressCheckbox.setValue(true, { emitEvent: false });
    this.progressCheckbox.markAsPristine();

    this.doneCheckbox.setValue(true, { emitEvent: false });
    this.doneCheckbox.markAsPristine();

    this.favoritesControl.setValue(null);
  }

  public openSettingsModal(): void {
    this.modalRef = this.modalService.open(SettingsModalComponent, {
      closeButton: false,
      enableClose: false,
      width: '620px',
      data: { taskBoard: this.initialState!, userSettings: this.userSettings },
    });

    this.modalRef.afterClosed$.pipe(untilDestroyed(this), take(1)).subscribe((callback: ModalCallback) => this.onModalClose(callback));
  }

  public openBacklogModal(): void {
    this.modalRef = this.modalService.open(BacklogModalComponent, {
      closeButton: false,
      width: '100%',
      data: { taskBoardId: this.initialState!.pk, column: this.initialState!.kanban_board_columns[0].pk! },
    });

    this.modalRef.afterClosed$.pipe(untilDestroyed(this), take(1)).subscribe((callback: ModalCallback) => this.onModalClose(callback));
  }

  public onModalClose(callback?: ModalCallback): void {
    if (callback?.state === ModalState.Changed) {
      this.taskBoardC.loadData();
    }
  }

  public onNewColumnModalClose(callback?: ModalCallback): void {
    if (callback?.state === ModalState.Changed) {
      this.taskBoardC.insertColumn(callback.data.title, callback.data.color);
    }
  }

  public onOpenNewCommentModal(): void {
    this.modalRef = this.modalService.open(NewCommentModalComponent, {
      closeButton: false,
      width: '912px',
      data: {
        id: this.id,
        contentType: this.initialState?.content_type,
        service: this.taskBoardsService,
      },
    });

    this.modalRef.afterClosed$.pipe(untilDestroyed(this), take(1)).subscribe((callback: ModalCallback) => {
      if (callback.state === ModalState.Changed) {
        this.comments.loadComments();
      }
    });
  }

  public onOpenDescriptionModal(): void {
    this.taskBoardsService.lock(this.id).pipe(take(1)).subscribe();
    this.modalRef = this.modalService.open(DescriptionModalComponent, {
      closeButton: false,
      width: '912px',
      data: {
        id: this.id,
        description: this.initialState?.description ?? '',
        descriptionKey: 'description',
        service: this.taskBoardsService,
      },
    });

    this.modalRef.afterClosed$.pipe(untilDestroyed(this), take(1)).subscribe((callback?: ModalCallback) => {
      if (callback?.state === ModalState.Changed) {
        this.initialState = { ...callback.data };
        this.form.markAsPristine();
        this.refreshChanges.next(true);
        this.refreshResetValue.next(true);
      }
      this.taskBoardsService.unlock(this.id).pipe(take(1)).subscribe();
    });
  }

  public onRefreshLinkList(): void {
    this.refreshLinkList.next(true);
  }
}
