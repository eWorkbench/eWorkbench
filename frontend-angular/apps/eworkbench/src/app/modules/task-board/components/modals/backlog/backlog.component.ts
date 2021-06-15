/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpParams } from '@angular/common/http';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { ModalState } from '@app/enums/modal-state.enum';
import { ProjectsService, TasksBacklogService } from '@app/services';
import { TableColumn, TableViewComponent } from '@eworkbench/table';
import { KanbanTask, Project } from '@eworkbench/types';
import { DialogRef } from '@ngneat/dialog';
import { FormBuilder } from '@ngneat/reactive-forms';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { of, Subject } from 'rxjs';
import { debounceTime, skip, switchMap } from 'rxjs/operators';

interface SelectedRow {
  task_id: string;
  kanban_board_column: string;
}

@UntilDestroy()
@Component({
  selector: 'eworkbench-backlog-modal',
  templateUrl: './backlog.component.html',
  styleUrls: ['./backlog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BacklogModalComponent implements OnInit {
  @ViewChild('tableView')
  public tableView!: TableViewComponent;

  @ViewChild('taskIdCellTemplate', { static: true })
  public taskIdCellTemplate!: TemplateRef<any>;

  @ViewChild('priorityCellTemplate', { static: true })
  public priorityCellTemplate!: TemplateRef<any>;

  @ViewChild('titleCellTemplate', { static: true })
  public titleCellTemplate!: TemplateRef<any>;

  @ViewChild('stateCellTemplate', { static: true })
  public stateCellTemplate!: TemplateRef<any>;

  @ViewChild('startDateCellTemplate', { static: true })
  public startDateCellTemplate!: TemplateRef<any>;

  @ViewChild('dueDateCellTemplate', { static: true })
  public dueDateCellTemplate!: TemplateRef<any>;

  public taskBoardId: string = this.modalRef.data.taskBoardId;

  public column: string = this.modalRef.data.column;

  public listColumns: TableColumn[] = [];

  public rows: any[] = [];

  public selected: SelectedRow[] = [];

  public state = ModalState.Unchanged;

  public loading = false;

  public projectsControl = this.fb.control<string | null>(null);

  public searchControl = this.fb.control<string | null>(null);

  public params = new HttpParams();

  public projects: Project[] = [];

  public favoriteProjects: Project[] = [];

  public projectsInput$ = new Subject<string>();

  public constructor(
    public readonly modalRef: DialogRef,
    public readonly tasksBacklogService: TasksBacklogService,
    private readonly projectsService: ProjectsService,
    private readonly fb: FormBuilder,
    private readonly cdr: ChangeDetectorRef,
    private readonly translocoService: TranslocoService
  ) {}

  public ngOnInit(): void {
    this.initTranslations();
    this.initSearch();
    this.initSearchInput();
  }

  public initTranslations(): void {
    this.translocoService
      .selectTranslateObject('taskBoard.backlogModal.columns')
      .pipe(untilDestroyed(this))
      .subscribe(column => {
        this.listColumns = [
          {
            cellTemplate: this.taskIdCellTemplate,
            name: column.taskId,
            key: 'task_id',
            sortable: true,
          },
          {
            cellTemplate: this.priorityCellTemplate,
            name: column.priority,
            key: 'priority',
            sortable: true,
          },
          {
            cellTemplate: this.titleCellTemplate,
            name: column.title,
            key: 'title',
            sortable: true,
          },
          {
            cellTemplate: this.stateCellTemplate,
            name: column.state,
            key: 'state',
            sortable: true,
          },
          {
            cellTemplate: this.startDateCellTemplate,
            name: column.startDate,
            key: 'start_date',
            sortable: true,
          },
          {
            cellTemplate: this.dueDateCellTemplate,
            name: column.dueDate,
            key: 'due_date',
            sortable: true,
          },
        ];
      });
  }

  public initSearch(): void {
    this.projectsControl.value$.pipe(untilDestroyed(this), skip(1), debounceTime(500)).subscribe(
      /* istanbul ignore next */ value => {
        if (value) {
          this.params = this.params.set('projects_recursive', value);
          this.tableView.loadData(false, this.params);
          return;
        }

        this.params = this.params.delete('projects_recursive');
        this.tableView.loadData(false, this.params);
      }
    );

    this.searchControl.value$.pipe(untilDestroyed(this), skip(1), debounceTime(500)).subscribe(
      /* istanbul ignore next */ value => {
        const queryParams = new URLSearchParams(window.location.search);

        if (value) {
          this.params = this.params.set('search', value);
          this.tableView.loadData(false, this.params);
          queryParams.set('search', value);
          return;
        }

        this.params = this.params.delete('search');
        this.tableView.loadData(false, this.params);
        queryParams.delete('search');
      }
    );
  }

  public initSearchInput(): void {
    this.projectsInput$
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

  public onSelected(rows: KanbanTask[]): void {
    /* istanbul ignore next */
    if (rows.length) {
      const selected = [];
      for (const row of rows) {
        selected.push({ task_id: row.pk, kanban_board_column: this.column });
      }
      this.selected = [...selected];
      this.state = ModalState.Changed;
    } else {
      this.selected = [];
    }
  }

  public onSubmit(): void {
    if (this.loading) {
      return;
    }
    this.loading = true;

    this.tasksBacklogService
      .addTasks(this.taskBoardId, this.selected)
      .pipe(untilDestroyed(this))
      .subscribe(
        /* istanbul ignore next */ () => {
          this.modalRef.close({ state: this.state });
        },
        /* istanbul ignore next */ () => {
          this.loading = false;
          this.cdr.markForCheck();
        }
      );
  }
}
