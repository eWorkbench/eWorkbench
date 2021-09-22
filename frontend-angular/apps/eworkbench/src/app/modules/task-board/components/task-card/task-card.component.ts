/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { animate, style, transition, trigger } from '@angular/animations';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommentsModalComponent } from '@app/modules/comment/components/modals/comments/comments.component';
import { PrivilegesModalComponent } from '@app/modules/details-dropdown/components/modals/privileges/privileges.component';
import { RecentChangesModalComponent } from '@app/modules/recent-changes/components/modals/recent-changes/recent-changes.component';
import { UserDetailsModalComponent } from '@app/modules/user/components/modals/user-details/user-details.component';
import { UsersListModalComponent } from '@app/modules/user/components/modals/users-list/users-list.component';
import { AuthService, TaskBoardsService, TasksService, WebSocketService } from '@app/services';
import { KanbanTask, Label, Task, User } from '@eworkbench/types';
import { DialogRef, DialogService } from '@ngneat/dialog';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { parseISO } from 'date-fns';
import { map } from 'rxjs/operators';

@UntilDestroy()
@Component({
  selector: 'eworkbench-task-card',
  templateUrl: './task-card.component.html',
  styleUrls: ['./task-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('grow', [
      transition(':enter', [style({ height: 0, opacity: 0, overflow: 'hidden' }), animate('.5s ease')]),
      transition(':leave', [
        animate(
          '.5s ease',
          // Can't use margin: 0 because of a bug in angular (since 6) otherwise it won't work in FireFox
          // https://github.com/angular/angular/issues/16330
          style({
            height: 0,
            opacity: 0,
            overflow: 'hidden',
            marginTop: 0,
            marginBottom: 0,
            marginLeft: 0,
            marginRight: 0,
          })
        ),
      ]),
    ]),
  ],
})
export class TaskCardComponent implements OnInit {
  @Input()
  public task!: KanbanTask;

  @Input()
  public taskBoardId!: string;

  @Input()
  public labels: Label[] = [];

  @Output()
  public removed = new EventEmitter<string>();

  public currentUser: User | null = null;

  public timeout?: any;

  public dropdownOpen = false;

  public modalRef?: DialogRef;

  public priority: Record<string, string> = {};

  public state: Record<string, string> = {};

  public expanded = false;

  public constructor(
    private readonly taskBoardsService: TaskBoardsService,
    private readonly tasksService: TasksService,
    private readonly modalService: DialogService,
    private readonly translocoService: TranslocoService,
    private readonly authService: AuthService,
    private readonly websocketService: WebSocketService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  public ngOnInit(): void {
    this.authService.user$.pipe(untilDestroyed(this)).subscribe(state => {
      this.currentUser = state.user;
    });

    this.websocketService.subscribe([{ model: 'task', pk: this.task.task_id }]);
    this.websocketService.elements.pipe(untilDestroyed(this)).subscribe(
      /* istanbul ignore next */ (data: any) => {
        /* istanbul ignore next */
        if (data.element_relations_changed?.model_pk === this.task.task_id) {
          this.refreshElementRelationsCounter();
        }
      }
    );

    this.initTranslations();
  }

  public initTranslations(): void {
    this.translocoService
      .selectTranslateObject('tasks')
      .pipe(untilDestroyed(this))
      .subscribe(tasks => {
        this.priority = {
          VHIGH: tasks.priority.veryHigh,
          HIGH: tasks.priority.high,
          NORM: tasks.priority.normal,
          LOW: tasks.priority.low,
          VLOW: tasks.priority.veryLow,
        };

        this.state = {
          NEW: tasks.state.new,
          PROG: tasks.state.inProgress,
          DONE: tasks.state.done,
        };
      });
  }

  public onRemove(): void {
    this.taskBoardsService
      .deleteCard(this.taskBoardId, this.task.pk)
      .pipe(untilDestroyed(this))
      .subscribe(() => this.removed.emit(this.task.pk));
  }

  public labelFilter(label: Label['pk']): Label | undefined {
    return this.labels.find(l => l.pk === label);
  }

  public checklistFilter(checklist: KanbanTask['task']['checklist_items']): number {
    return checklist.filter(c => c.checked).length;
  }

  public assigneesFormat(assignee: User): string {
    return assignee.userprofile.first_name ? `${assignee.userprofile.first_name} ${assignee.userprofile.last_name!}` : assignee.username!;
  }

  public openRecentChangesModal(id: string): void {
    /* istanbul ignore next */
    this.modalService.open(RecentChangesModalComponent, {
      closeButton: false,
      data: { service: this.tasksService, id },
    });
  }

  public openUserModal(user: User): void {
    /* istanbul ignore next */
    this.modalService.open(UserDetailsModalComponent, { closeButton: false, data: { user } });
  }

  public openMoreModal(users: User[]): void {
    /* istanbul ignore next */
    this.modalService.open(UsersListModalComponent, { closeButton: false, data: { users: users } });
  }

  public openCommentsModal(kanbanTask: KanbanTask): void {
    if (!this.currentUser?.pk) {
      return;
    }

    this.tasksService
      .get(kanbanTask.task_id, this.currentUser.pk)
      .pipe(
        untilDestroyed(this),
        map(/* istanbul ignore next */ privilegesData => privilegesData.data)
      )
      .subscribe(task => {
        /* istanbul ignore next */
        this.modalService.open(CommentsModalComponent, {
          closeButton: false,
          width: '912px',
          data: { service: this.tasksService, element: task, create: true },
        });
      });
  }

  public openPrivilegesModal(task: Task): void {
    /* istanbul ignore next */
    this.modalService.open(PrivilegesModalComponent, {
      closeButton: false,
      data: { service: this.tasksService, id: task.pk, data: task },
    });
  }

  public isDueDateExpired(dueDate?: string): boolean {
    if (!dueDate) {
      return false;
    }

    return parseISO(dueDate).getTime() - new Date().getTime() < 0;
  }

  public onToggleExpand(): void {
    this.expanded = !this.expanded;
  }

  public prepareAssignees(users: User[]): User[] {
    // Prepares assignees as follows:
    // If the current user is an assignee, put the user in first position.
    // If there are less than or equal to three assignees then add users until a maximum of three.
    // If there are more than three assignees then return only two users and a "more" icon.

    const clonedUsers = [...users];
    const assignees = clonedUsers.filter(user => user.pk === this.currentUser?.pk);
    const moreUsersCount = 3 - assignees.length - (clonedUsers.length > 3 ? 1 : 0);
    const moreUsers = clonedUsers.filter(user => user.pk !== this.currentUser?.pk).slice(0, moreUsersCount);
    assignees.push(...moreUsers);

    return assignees.reverse();
  }

  public refreshElementRelationsCounter(): void {
    this.taskBoardsService
      .getTasks(this.taskBoardId)
      .pipe(untilDestroyed(this))
      .subscribe(
        /* istanbul ignore next */ tasks => {
          const task = tasks.filter(task => task.task_id === this.task.task_id);
          if (task.length) {
            this.task.num_related_comments = task[0].num_related_comments;
            this.task.num_relations = task[0].num_relations!;
            this.cdr.markForCheck();
          }
        }
      );
  }
}
