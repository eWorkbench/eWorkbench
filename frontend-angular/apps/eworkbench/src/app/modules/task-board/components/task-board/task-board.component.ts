/* istanbul ignore file */

/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { BreakpointObserver } from '@angular/cdk/layout';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ModalState } from '@app/enums/modal-state.enum';
import { NewTaskModalComponent } from '@app/modules/task/components/modals/new/new.component';
import { AuthService, LabelsService, TaskBoardsService, WebSocketService } from '@app/services';
import { UserState } from '@app/stores/user';
import {
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
import { Observable } from 'rxjs';
import { map, switchMap, take } from 'rxjs/operators';
import { BacklogModalComponent } from '../modals/backlog/backlog.component';
import { ColumnDetailsModalComponent } from '../modals/column-details/column-details.component';

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

  @Output()
  public boardChange = new EventEmitter<PrivilegesData<TaskBoard>>();

  public id = this.route.snapshot.paramMap.get('id')!;

  public currentUser!: User;

  public privileges?: Privileges;

  public loading = true;

  public tasks = this.taskBoardsService.getTasks(this.id);

  public dropListOrientation = 'vertical';

  public labels: Label[] = [];

  public modalRef?: DialogRef;

  public filter: TaskBoardFilter = { user: null, search: null };

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
    private readonly router: Router
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

    /* istanbul ignore next */
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
        /* istanbul ignore next */ () => {
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
        /* istanbul ignore next */ (error: HttpErrorResponse) => {
          if (error.status === 404) {
            this.router.navigate(['/not-found']);
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
      map(
        /* istanbul ignore next */ (state: NonNullable<UserState>) => {
          const user = state.user!;
          this.currentUser = { ...user };
          this.cdr.markForCheck();

          return user;
        }
      ),
      switchMap(user => {
        return this.taskBoardsService.get(this.id, user.pk!).pipe(
          untilDestroyed(this),
          map(
            /* istanbul ignore next */ privilegesData => {
              const privileges = privilegesData.privileges;

              this.privileges = { ...privileges };

              return privilegesData;
            }
          )
        );
      })
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
      switchMap(() => {
        return this.tasks.pipe(
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
        );
      })
    );
  }

  public insertColumn(): void {
    const columns: TaskBoardColumn[] = [
      ...this.columns,
      {
        color: 'rgba(224,224,224,0.65)',
        icon: '',
        ordering: this.columns.length + 1,
        title: 'New column',
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

  public openBacklogModal(column: string): void {
    /* istanbul ignore next */
    this.modalRef = this.modalService.open(BacklogModalComponent, {
      closeButton: false,
      width: '100%',
      data: { taskBoardId: this.id, column },
    });
    /* istanbul ignore next */
    this.modalRef.afterClosed$.pipe(untilDestroyed(this), take(1)).subscribe((callback: ModalCallback) => this.onModalClose(callback));
  }

  public openNewTaskModal(column: string): void {
    /* istanbul ignore next */
    this.modalRef = this.modalService.open(NewTaskModalComponent, {
      closeButton: false,
      data: { taskBoardId: this.id, initialState: { projects: this.projects }, column },
    });
    /* istanbul ignore next */
    this.modalRef.afterClosed$.pipe(untilDestroyed(this), take(1)).subscribe((callback: ModalCallback) => this.onModalClose(callback));
  }

  public openColumnDetailsModal(column: TaskBoardColumn): void {
    /* istanbul ignore next */
    this.modalRef = this.modalService.open(ColumnDetailsModalComponent, {
      closeButton: false,
      data: { column, taskBoardId: this.id, columns: this.columns },
    });
    /* istanbul ignore next */
    this.modalRef.afterClosed$.pipe(untilDestroyed(this), take(1)).subscribe((callback: ModalCallback) => this.onModalClose(callback));
  }

  public onModalClose(callback?: ModalCallback): void {
    if (callback?.state === ModalState.Changed) {
      this.loadData();
    }
  }

  public matchesFilter(task: Task): boolean {
    if (this.filter.user) {
      return task.assigned_users_pk.includes(this.filter.user);
    }

    if (this.filter.search) {
      const taskId = `#${task.task_id}`;
      const taskTitle = task.title.toLowerCase();
      const taskDescription = task.description.toLowerCase();
      const searchTerm = this.filter.search.toLowerCase();
      return taskTitle.includes(searchTerm) || taskDescription.includes(searchTerm) || taskId.includes(searchTerm);
    }

    return true;
  }
}
