/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ModalState } from '@app/enums/modal-state.enum';
import { LabelsService, ProjectsService, TasksService } from '@app/services';
import type { DropdownElement, Label, ModalCallback, Project, Task, TaskChecklist, User } from '@eworkbench/types';
import { DialogRef } from '@ngneat/dialog';
import { FormBuilder } from '@ngneat/reactive-forms';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { format, parseISO } from 'date-fns';
import { ToastrService } from 'ngx-toastr';
import { map } from 'rxjs/operators';

@UntilDestroy()
@Component({
  selector: 'eworkbench-task-preview',
  templateUrl: './task.component.html',
  styleUrls: ['./task.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskPreviewComponent implements OnInit {
  @Input()
  public id?: string;

  @Input()
  public version?: string;

  @Input()
  public versionInProgress?: number | null;

  @Input()
  public modalRef!: DialogRef;

  @Output()
  public closed = new EventEmitter<ModalCallback>();

  public state = ModalState.Unchanged;

  public task?: Task;

  public fullDayControl = this.fb.control<boolean>(false);

  public startDateFormControl = this.fb.control<string | null>(null);

  public dueDateFormControl = this.fb.control<string | null>(null);

  public descriptionFormControl = this.fb.control<string | null>(null);

  public assigneesFormControl = this.fb.control<number[] | null>(null);

  public assignees: User[] = [];

  public projectsFormControl = this.fb.control<string[] | null>(null);

  public projects: Project[] = [];

  public priorityFormControl = this.fb.control<string | null>(null);

  public priorities: DropdownElement[] = [];

  public stateFormControl = this.fb.control<string | null>(null);

  public states: DropdownElement[] = [];

  public checklistFormControl = this.fb.control<TaskChecklist[]>([]);

  public labels: Label[] = [];

  public loading = true;

  public readonly dateFormat = "yyyy-MM-dd HH':'mm";

  public constructor(
    private readonly toastrService: ToastrService,
    private readonly translocoService: TranslocoService,
    private readonly tasksService: TasksService,
    private readonly labelsService: LabelsService,
    private readonly projectsService: ProjectsService,
    private readonly fb: FormBuilder,
    private readonly cdr: ChangeDetectorRef
  ) {}

  public ngOnInit(): void {
    this.initTranslations();
    this.initDetails();
  }

  public initTranslations(): void {
    this.translocoService
      .selectTranslateObject('tasks')
      .pipe(untilDestroyed(this))
      .subscribe(tasks => {
        this.priorities = [
          { label: tasks.priority.veryHigh, value: '5' },
          { label: tasks.priority.high, value: '4' },
          { label: tasks.priority.normal, value: '3' },
          { label: tasks.priority.low, value: '2' },
          { label: tasks.priority.veryLow, value: '1' },
        ];

        this.states = [
          { label: tasks.state.new, value: 'NEW' },
          { label: tasks.state.inProgress, value: 'PROG' },
          { label: tasks.state.done, value: 'DONE' },
        ];
      });
  }

  public initDetails(): void {
    this.tasksService
      .previewVersion(this.id!, this.version!)
      .pipe(untilDestroyed(this))
      .subscribe(
        (task: Task) => {
          this.task = { ...task };

          this.assignees = task.assigned_users;
          this.assigneesFormControl.patchValue(task.assigned_users_pk, { emitEvent: false });
          this.assigneesFormControl.disable({ emitEvent: false });

          const startDate = task.start_date ? format(parseISO(task.start_date), this.dateFormat) : null;
          this.startDateFormControl.patchValue(startDate, { emitEvent: false });
          this.startDateFormControl.disable({ emitEvent: false });

          const dueDate = task.due_date ? format(parseISO(task.due_date), this.dateFormat) : null;
          this.dueDateFormControl.patchValue(dueDate, { emitEvent: false });
          this.dueDateFormControl.disable({ emitEvent: false });

          this.fullDayControl.patchValue(task.full_day, { emitEvent: false });
          this.fullDayControl.disable({ emitEvent: false });

          this.priorityFormControl.patchValue(task.priority, { emitEvent: false });
          this.priorityFormControl.disable({ emitEvent: false });

          this.stateFormControl.patchValue(task.state, { emitEvent: false });
          this.stateFormControl.disable({ emitEvent: false });

          this.checklistFormControl.patchValue(task.checklist_items, { emitEvent: false });
          this.checklistFormControl.disable({ emitEvent: false });

          this.descriptionFormControl.patchValue(task.description, { emitEvent: false });
          this.descriptionFormControl.disable({ emitEvent: false });

          this.loadProjects(task.projects);
          this.projectsFormControl.patchValue(task.projects, { emitEvent: false });
          this.projectsFormControl.disable({ emitEvent: false });

          this.loadLabels(task.labels);

          this.loading = false;
          this.cdr.markForCheck();
        },
        () => {
          this.loading = false;
          this.cdr.markForCheck();
        }
      );
  }

  public loadProjects(projects: string[]): void {
    projects.forEach(id => {
      this.projectsService
        .get(id)
        .pipe(untilDestroyed(this))
        .subscribe(project => {
          this.projects = [...this.projects, project];
          this.cdr.markForCheck();
        });
    });
  }

  public loadLabels(selectedLabels: string[]): void {
    this.labelsService
      .get()
      .pipe(
        untilDestroyed(this),
        map(labels => {
          selectedLabels.forEach(label => {
            labels.forEach(apiLabel => {
              if (label === apiLabel.pk) {
                if (this.labels.length) {
                  this.labels = [...this.labels, apiLabel];
                } else {
                  this.labels = [apiLabel];
                }
              }
            });
          });
        })
      )
      .subscribe(() => {
        this.cdr.markForCheck();
      });
  }

  public onRestoreVersion(): void {
    if (this.loading) {
      return;
    }
    this.loading = true;

    this.tasksService
      .restoreVersion(this.id!, this.version!, Boolean(this.versionInProgress))
      .pipe(untilDestroyed(this))
      .subscribe(
        () => {
          this.state = ModalState.Changed;
          this.modalRef.close({ state: this.state });
          this.translocoService
            .selectTranslate('versions.toastr.success.versionRestored')
            .pipe(untilDestroyed(this))
            .subscribe(versionRestored => {
              this.toastrService.success(versionRestored);
            });
        },
        () => {
          this.loading = false;
          this.cdr.markForCheck();
        }
      );
  }
}
