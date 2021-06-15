/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { animate, style, transition, trigger } from '@angular/animations';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, HostListener, Input, OnInit, Output } from '@angular/core';
import { CommentsModalComponent } from '@app/modules/comment/components/modals/comments/comments.component';
import { PrivilegesModalComponent } from '@app/modules/details-dropdown/components/modals/privileges/privileges.component';
import { RecentChangesModalComponent } from '@app/modules/recent-changes/components/modals/recent-changes/recent-changes.component';
import { UserDetailsModalComponent } from '@app/modules/user/components/modals/user-details/user-details.component';
import { AuthService, TaskBoardsService, TasksService } from '@app/services';
import { KanbanTask, Label, Task, User } from '@eworkbench/types';
import { DialogRef, DialogService } from '@ngneat/dialog';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
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

  @Input()
  public expanded = false;

  @Output()
  public removed = new EventEmitter<string>();

  public currentUser: User | null = null;

  public timeout?: any;

  public dropdownOpen = false;

  public modalRef?: DialogRef;

  public priority: Record<string, string> = {};

  public state: Record<string, string> = {};

  /* istanbul ignore next */
  @HostListener('mouseenter')
  public onMouseEnter(): void {
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
    this.timeout = setTimeout(() => {
      this.expanded = true;
      this.cdr.markForCheck();
    }, 500);
  }

  /* istanbul ignore next */
  @HostListener('mouseleave')
  public onMouseLeave(): void {
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
    if (this.dropdownOpen) {
      return;
    }
    this.expanded = false;
  }

  public constructor(
    private readonly taskBoardsService: TaskBoardsService,
    private readonly tasksService: TasksService,
    private readonly cdr: ChangeDetectorRef,
    private readonly modalService: DialogService,
    private readonly translocoService: TranslocoService,
    private readonly authService: AuthService
  ) {}

  public ngOnInit(): void {
    this.authService.user$.pipe(untilDestroyed(this)).subscribe(state => {
      this.currentUser = state.user;
    });

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

  public onOpenChange(visible: boolean): void {
    if (this.expanded && !visible) {
      this.expanded = false;
    }
    this.dropdownOpen = visible;
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

  public assignedUsersFormat(assignedUser: User): string {
    return assignedUser.userprofile.first_name
      ? `${assignedUser.userprofile.first_name} ${assignedUser.userprofile.last_name!}`
      : assignedUser.username!;
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
          data: { service: this.tasksService, element: task },
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
}
