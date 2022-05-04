/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { BreakpointObserver } from '@angular/cdk/layout';
import type { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ModalState } from '@app/enums/modal-state.enum';
import { NewTaskModalComponent } from '@app/modules/task/components/modals/new/new.component';
import { AuthService, LabelsService, TaskBoardsService, WebSocketService } from '@app/services';
import { UserState, UserStore } from '@app/stores/user';
import type {
  KanbanTask,
  Label,
  ModalCallback,
  Privileges,
  PrivilegesData,
  Task,
  TaskBoard,
  TaskBoardColumn,
  TaskBoardFilter,
  User,
} from '@eworkbench/types';
import { DialogRef, DialogService } from '@ngneat/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import type { Observable } from 'rxjs';
import { map, switchMap, take } from 'rxjs/operators';
import { BacklogModalComponent } from '../modals/backlog/backlog.component';
import { ColumnDetailsModalComponent } from '../modals/column-details/column-details.component';
import { DeleteColumnModalComponent } from '../modals/delete-column/delete-column.component';

@UntilDestroy()
@Component({
  selector: 'eworkbench-task-board',
  templateUrl: './task-board.component.html',
  styleUrls: ['./task-board.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskBoardComponent implements OnInit, OnDestroy {
  @Input()
  public columns: TaskBoardColumn[] = [];

  @Input()
  public projects: string[] = [];

  @Input()
  public setFilter?: EventEmitter<TaskBoardFilter>;

  @Input()
  public userSettings = {};

  @Output()
  public boardChange = new EventEmitter<PrivilegesData<TaskBoard>>();

  public id = this.route.snapshot.paramMap.get('id')!;

  public currentUser!: User;

  public privileges?: Privileges;

  public loading = true;

  public tasks = this.taskBoardsService.getTasks(this.id).pipe(untilDestroyed(this));

  public dropListOrientation = 'vertical';

  public labels: Label[] = [];

  public modalRef?: DialogRef;

  public filter: TaskBoardFilter = { assignee: null, user: null, project: null, search: null, priority: null, state: null, favorite: null };

  private skipNext = false;

  public constructor(
    private readonly taskBoardsService: TaskBoardsService,
    private readonly labelsService: LabelsService,
    private readonly route: ActivatedRoute,
    private readonly cdr: ChangeDetectorRef,
    private readonly breakpointObserver: BreakpointObserver,
    private readonly modalService: DialogService,
    private readonly websocketService: WebSocketService,
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly userStore: UserStore
  ) {}

  public ngOnInit(): void {
    // There is currently no way to have a bi-directional drag n drop,
    // so we observe the breakpoint change here and change the drop list orientation
    // https://github.com/angular/material2/issues/13372
    this.breakpointObserver.observe(['(min-width: 769px)']).subscribe(res => {
      /* istanbul ignore if */
      if (res.matches) {
        this.dropListOrientation = 'horizontal';
        this.cdr.markForCheck();
        return;
      }

      this.dropListOrientation = 'vertical';
      this.cdr.markForCheck();
    });

    this.setFilter?.pipe(untilDestroyed(this)).subscribe(filter => {
      this.filter = filter;
      this.cdr.markForCheck();
    });

    this.initDetails();
  }

  public ngOnDestroy(): void {
    this.websocketService.unsubscribe();
  }

  public initDetails(): void {
    this.taskBoard()
      .pipe(untilDestroyed(this))
      .subscribe(
        () => {
          this.loadData();

          this.websocketService.subscribe([{ model: 'kanbanboard', pk: this.id }]);
          this.websocketService.elements.pipe(untilDestroyed(this)).subscribe((data: any) => {
            if (data.kanbanboard_task_assignment_changed?.model_pk === this.id) {
              if (this.skipNext) {
                this.skipNext = false;
                return;
              }
              this.loadData();
            } else if (data.element_changed) {
              if (this.skipNext) {
                this.skipNext = false;
                return;
              }
              this.loadData();
            }
          });

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

  public taskBoard(): Observable<PrivilegesData<TaskBoard>> {
    return this.authService.user$.pipe(
      untilDestroyed(this),
      take(1),
      map((state: NonNullable<UserState>) => {
        const user = state.user!;
        this.currentUser = { ...user };
        this.cdr.markForCheck();

        return user;
      }),
      switchMap(user =>
        this.taskBoardsService.get(this.id, user.pk!).pipe(
          untilDestroyed(this),
          map(privilegesData => {
            const privileges = privilegesData.privileges;

            this.privileges = { ...privileges };

            return privilegesData;
          })
        )
      )
    );
  }

  public loadData(): void {
    this.prepareColumns()
      .pipe(untilDestroyed(this))
      .subscribe(columns => {
        this.columns = [...columns];
        this.cdr.markForCheck();
      });

    this.labelsService
      .get()
      .pipe(untilDestroyed(this))
      .subscribe(labels => {
        this.labels = labels;
        this.cdr.markForCheck();
      });
  }

  public prepareColumns(): Observable<TaskBoardColumn[]> {
    let columns: TaskBoardColumn[] = [];

    return this.taskBoard().pipe(
      untilDestroyed(this),
      map(privilegesData => {
        const board = privilegesData.data;
        this.boardChange.emit(privilegesData);
        columns = [...board.kanban_board_columns];
        for (const column of columns) {
          column.tasks = [];
        }
      }),
      switchMap(() =>
        this.tasks.pipe(
          map(task => {
            for (const data of task) {
              if (data.task.deleted) continue;
              const column = columns.find(column => column.pk === data.kanban_board_column);
              if (column && Array.isArray(column.tasks)) {
                column.tasks = [...column.tasks, data];
              }
              this.websocketService.subscribe([{ model: 'task', pk: data.task_id }]);
            }
            return columns;
          })
        )
      )
    );
  }

  public insertColumn(title?: string, color?: string): void {
    const columns: TaskBoardColumn[] = [
      ...this.columns,
      {
        color: color ?? 'rgba(244,244,244,1)',
        icon: '',
        ordering: this.columns.length + 1,
        title: title ?? 'New column',
      },
    ];

    this.taskBoardsService
      .moveColumn(this.id, columns)
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.loadData();
        this.cdr.markForCheck();
      });
  }

  public onColumnDrop(event: CdkDragDrop<TaskBoardColumn[]>): void {
    if (event.previousIndex === event.currentIndex) {
      return;
    }
    moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    let i = 1;
    for (const column of this.columns) {
      column.ordering = i++;
    }
    this.columns = [...this.columns];
    this.skipNext = true;
    this.taskBoardsService.moveColumn(this.id, this.columns).pipe(untilDestroyed(this)).subscribe(/* () => (this.skipNext = false)*/);
  }

  public onCardDrop(event: CdkDragDrop<KanbanTask[]>): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      this.columns = [...this.columns];
      this.skipNext = true;
      this.taskBoardsService
        .moveCard(this.id, {
          assignment_pk: event.item.data.pk,
          to_column: event.item.data.kanban_board_column,
          to_index: event.currentIndex,
        })
        .pipe(untilDestroyed(this))
        .subscribe(/* () => (this.skipNext = false)*/);
    } else {
      transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);
      (event.item.data as KanbanTask).kanban_board_column = event.container.element.nativeElement.parentElement!.dataset.pk!;
      this.columns = [...this.columns];
      this.skipNext = true;
      this.taskBoardsService
        .moveCard(this.id, {
          assignment_pk: event.item.data.pk,
          to_column: event.item.data.kanban_board_column,
          to_index: event.currentIndex,
        })
        .pipe(untilDestroyed(this))
        .subscribe(() => (this.skipNext = false));
    }
  }

  public onRemove(taskId: string): void {
    for (const column of this.columns) {
      column.tasks = column.tasks?.filter(task => task.pk !== taskId);
    }
    this.columns = [...this.columns];
  }

  public openBacklogModal(column?: string): void {
    this.modalRef = this.modalService.open(BacklogModalComponent, {
      closeButton: false,
      width: '100%',
      data: { taskBoardId: this.id, column },
    });

    this.modalRef.afterClosed$.pipe(untilDestroyed(this), take(1)).subscribe((callback: ModalCallback) => this.onModalClose(callback));
  }

  public openNewTaskModal(column?: string): void {
    this.modalRef = this.modalService.open(NewTaskModalComponent, {
      closeButton: false,
      enableClose: false,
      data: { taskBoardId: this.id, initialState: { projects: this.projects }, column },
    });

    this.modalRef.afterClosed$.pipe(untilDestroyed(this), take(1)).subscribe((callback: ModalCallback) => this.onModalClose(callback));
  }

  public openColumnDetailsModal(column: TaskBoardColumn): void {
    this.modalRef = this.modalService.open(ColumnDetailsModalComponent, {
      closeButton: false,
      data: { column, taskBoardId: this.id, columns: this.columns },
    });

    this.modalRef.afterClosed$.pipe(untilDestroyed(this), take(1)).subscribe((callback: ModalCallback) => this.onModalClose(callback));
  }

  public onRemoveColumn(column: TaskBoardColumn): void {
    const userStoreValue = this.userStore.getValue();

    const skipTrashDialog = Boolean(userStoreValue.user?.userprofile.ui_settings?.confirm_dialog?.['SkipDialog-DeleteColumn']);

    if (skipTrashDialog) {
      this.delete(column);
    } else {
      this.modalRef = this.modalService.open(DeleteColumnModalComponent, {
        closeButton: false,
        windowClass: 'modal-danger',
        data: { column, taskBoardId: this.id, columns: this.columns },
      });

      this.modalRef.afterClosed$.pipe(untilDestroyed(this), take(1)).subscribe((callback: ModalCallback) => this.onModalClose(callback));
    }
  }

  public delete(column: TaskBoardColumn): void {
    if (this.loading) {
      return;
    }
    this.loading = true;

    let order = 1;
    const columns: TaskBoardColumn[] = this.columns
      .filter((col: TaskBoardColumn) => col.pk !== column.pk)
      .map((col: TaskBoardColumn) => {
        col.ordering = order++;
        return col;
      });

    this.taskBoardsService
      .moveColumn(this.id, columns)
      .pipe(untilDestroyed(this))
      .subscribe(
        () => {
          this.loading = false;
          this.cdr.markForCheck();
        },
        () => {
          this.loading = false;
          this.cdr.markForCheck();
        }
      );
  }

  public onModalClose(callback?: ModalCallback): void {
    if (callback?.state === ModalState.Changed) {
      this.loadData();
    }
  }

  public matchesFilter(task: Task): boolean {
    let userFilter = false;
    let assigneeFilter = false;
    let projectFilter = false;
    let searchFilter = false;
    let priorityFilter = false;
    let stateFilter = false;
    let favoriteFilter = false;

    if (this.filter.user) {
      userFilter = task.created_by.pk === this.filter.user;
    }

    if (this.filter.assignee) {
      assigneeFilter = task.assigned_users_pk.includes(this.filter.assignee);
    }

    if (this.filter.project) {
      projectFilter = task.projects.includes(this.filter.project);
    }

    if (this.filter.search) {
      const taskId = `#${task.task_id}`;
      const taskTitle = task.title.toLowerCase();
      const taskDescription = task.description.toLowerCase();
      const searchTerm = this.filter.search.toLowerCase();
      searchFilter = taskTitle.includes(searchTerm) || taskDescription.includes(searchTerm) || taskId.includes(searchTerm);
    }

    if (this.filter.priority && this.filter.priority.length !== 5) {
      priorityFilter = this.filter.priority.includes(task.priority);
    }

    if (this.filter.state && this.filter.state.length !== 3) {
      stateFilter = this.filter.state.includes(task.state);
    }

    if (this.filter.favorite) {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-boolean-literal-compare
      favoriteFilter = task.is_favourite === true;
    }

    if (
      this.filter.user ||
      this.filter.assignee ||
      this.filter.project ||
      this.filter.search ||
      (this.filter.priority && this.filter.priority.length !== 5) ||
      (this.filter.state && this.filter.state.length !== 3) ||
      this.filter.favorite
    ) {
      if (userFilter || assigneeFilter || projectFilter || searchFilter || priorityFilter || stateFilter || favoriteFilter) {
        return true;
      }

      return false;
    }

    return true;
  }
}
