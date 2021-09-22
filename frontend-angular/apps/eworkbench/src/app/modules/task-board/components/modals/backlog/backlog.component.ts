/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpParams } from '@angular/common/http';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { ModalState } from '@app/enums/modal-state.enum';
import { AuthService, ProjectsService, TasksBacklogService } from '@app/services';
import { UserService } from '@app/stores/user';
import { TableColumn, TableViewComponent } from '@eworkbench/table';
import { KanbanTask, Project, User } from '@eworkbench/types';
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
  public currentUser: User | null = null;

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

  @ViewChild('assigneesCellTemplate', { static: true })
  public assigneesCellTemplate!: TemplateRef<any>;

  @ViewChild('actionsCellTemplate', { static: true })
  public actionsCellTemplate!: TemplateRef<any>;

  public taskBoardId: string = this.modalRef.data.taskBoardId;

  public column: string = this.modalRef.data.column;

  public listColumns: TableColumn[] = [];

  public rows: any[] = [];

  public selected: SelectedRow[] = [];

  public state = ModalState.Unchanged;

  public loading = false;

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

  public doneCheckbox = this.fb.control<boolean>(false);

  public favoritesControl = this.fb.control<boolean | null>(null);

  public params = new HttpParams().set('state', 'NEW,PROG').set('priority', 'VHIGH,HIGH,NORM,LOW,VLOW');

  public users: User[] = [];

  public assignees: User[] = [];

  public projects: Project[] = [];

  public usersInput$ = new Subject<string>();

  public assigneesInput$ = new Subject<string>();

  public favoriteProjects: Project[] = [];

  public projectsInput$ = new Subject<string>();

  public showUserFilter = false;

  public showAssigneesFilter = false;

  public constructor(
    public readonly modalRef: DialogRef,
    public readonly tasksBacklogService: TasksBacklogService,
    private readonly projectsService: ProjectsService,
    private readonly fb: FormBuilder,
    private readonly cdr: ChangeDetectorRef,
    private readonly translocoService: TranslocoService,
    private readonly authService: AuthService,
    private readonly userService: UserService
  ) {}

  public get filtersChanged(): boolean {
    /* eslint-disable */
    return Boolean(
      this.projectsControl.value ||
        this.usersControl.value ||
        this.assigneesControl.value ||
        this.searchControl.value ||
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

  public get getFilterSelectedAssignee(): User | undefined {
    return this.assignees.find(user => user.pk === this.assigneesControl.value);
  }

  public get getFilterSelectedProject(): Project | undefined {
    return this.projects.find(project => project.pk === this.projectsControl.value);
  }

  public ngOnInit(): void {
    this.authService.user$.pipe(untilDestroyed(this)).subscribe(
      /* istanbul ignore next */ state => {
        this.currentUser = state.user;
      }
    );

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
          {
            cellTemplate: this.assigneesCellTemplate,
            name: column.assignees,
            key: 'assigned_users',
          },
          {
            cellTemplate: this.actionsCellTemplate,
            name: '',
            key: 'actions',
            hideable: false,
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
        } else {
          this.params = this.params.delete('projects_recursive');
          this.tableView.loadData(false, this.params);
        }
      }
    );

    this.usersControl.value$.pipe(untilDestroyed(this), skip(1), debounceTime(500)).subscribe(
      /* istanbul ignore next */ value => {
        if (value) {
          this.params = this.params.set('created_by', value);
          this.tableView.loadData(false, this.params);
          // TODO: Needs endpoint to fetch a user by its id
          /* this.router.navigate(['.'], { relativeTo: this.route, queryParams: { users: value }, queryParamsHandling: 'merge' }); */
        } else {
          this.params = this.params.delete('created_by');
          this.tableView.loadData(false, this.params);
          // TODO: Needs endpoint to fetch a user by its id
          /* this.router.navigate(['.'], { relativeTo: this.route, queryParams: { users: null }, queryParamsHandling: 'merge' }); */
        }
      }
    );

    this.assigneesControl.value$.pipe(untilDestroyed(this), skip(1), debounceTime(500)).subscribe(
      /* istanbul ignore next */ value => {
        if (value) {
          this.params = this.params.set('assigned_users', value);
          this.tableView.loadData(false, this.params);
          // TODO: Needs endpoint to fetch a user by its id
          /* this.router.navigate(['.'], { relativeTo: this.route, queryParams: { assignees: value }, queryParamsHandling: 'merge' }); */
        } else {
          this.params = this.params.delete('assigned_users');
          this.tableView.loadData(false, this.params);
          // TODO: Needs endpoint to fetch a user by its id
          /* this.router.navigate(['.'], { relativeTo: this.route, queryParams: { assignees: null }, queryParamsHandling: 'merge' }); */
        }
      }
    );

    this.searchControl.value$.pipe(untilDestroyed(this), skip(1), debounceTime(500)).subscribe(
      /* istanbul ignore next */ value => {
        if (value) {
          this.params = this.params.set('search', value);
          this.tableView.loadData(false, this.params);
        } else {
          this.params = this.params.delete('search');
          this.tableView.loadData(false, this.params);
        }
      }
    );

    this.veryHighCheckbox.value$.pipe(untilDestroyed(this), skip(1), debounceTime(500)).subscribe(
      /* istanbul ignore next */ value => {
        const params = this.params
          .getAll('priority')?.[0]
          .split(',')
          .filter(/* istanbul ignore next */ params => params !== 'VHIGH');
        if (value) {
          this.params = this.params.delete('priority');
          if (params?.length) {
            this.params = this.params.set('priority', [...params, 'VHIGH'].join(','));
          }

          this.tableView.loadData(false, this.params);
        } else {
          this.params = this.params.delete('priority');
          if (params?.length) {
            this.params = this.params.set('priority', params.join(','));
          }
          this.tableView.loadData(false, this.params);
        }
      }
    );

    this.highCheckbox.value$.pipe(untilDestroyed(this), skip(1), debounceTime(500)).subscribe(
      /* istanbul ignore next */ value => {
        const params = this.params
          .getAll('priority')?.[0]
          .split(',')
          .filter(/* istanbul ignore next */ params => params !== 'HIGH');
        if (value) {
          this.params = this.params.delete('priority');
          if (params?.length) {
            this.params = this.params.set('priority', [...params, 'HIGH'].join(','));
          }

          this.tableView.loadData(false, this.params);
        } else {
          this.params = this.params.delete('priority');
          if (params?.length) {
            this.params = this.params.set('priority', params.join(','));
          }
          this.tableView.loadData(false, this.params);
        }
      }
    );

    this.normalCheckbox.value$.pipe(untilDestroyed(this), skip(1), debounceTime(500)).subscribe(
      /* istanbul ignore next */ value => {
        const params = this.params
          .getAll('priority')?.[0]
          .split(',')
          .filter(/* istanbul ignore next */ params => params !== 'NORM');
        if (value) {
          this.params = this.params.delete('priority');
          if (params?.length) {
            this.params = this.params.set('priority', [...params, 'NORM'].join(','));
          }

          this.tableView.loadData(false, this.params);
        } else {
          this.params = this.params.delete('priority');
          if (params?.length) {
            this.params = this.params.set('priority', params.join(','));
          }
          this.tableView.loadData(false, this.params);
        }
      }
    );

    this.lowCheckbox.value$.pipe(untilDestroyed(this), skip(1), debounceTime(500)).subscribe(
      /* istanbul ignore next */ value => {
        const params = this.params
          .getAll('priority')?.[0]
          .split(',')
          .filter(/* istanbul ignore next */ params => params !== 'LOW');
        if (value) {
          this.params = this.params.delete('priority');
          if (params?.length) {
            this.params = this.params.set('priority', [...params, 'LOW'].join(','));
          }

          this.tableView.loadData(false, this.params);
        } else {
          this.params = this.params.delete('priority');
          if (params?.length) {
            this.params = this.params.set('priority', params.join(','));
          }
          this.tableView.loadData(false, this.params);
        }
      }
    );

    this.veryLowCheckbox.value$.pipe(untilDestroyed(this), skip(1), debounceTime(500)).subscribe(
      /* istanbul ignore next */ value => {
        const params = this.params
          .getAll('priority')?.[0]
          .split(',')
          .filter(/* istanbul ignore next */ params => params !== 'VLOW');
        if (value) {
          this.params = this.params.delete('priority');
          if (params?.length) {
            this.params = this.params.set('priority', [...params, 'VLOW'].join(','));
          }

          this.tableView.loadData(false, this.params);
        } else {
          this.params = this.params.delete('priority');
          if (params?.length) {
            this.params = this.params.set('priority', params.join(','));
          }
          this.tableView.loadData(false, this.params);
        }
      }
    );

    this.newCheckbox.value$.pipe(untilDestroyed(this), skip(1), debounceTime(500)).subscribe(
      /* istanbul ignore next */ value => {
        const params = this.params
          .getAll('state')?.[0]
          .split(',')
          .filter(/* istanbul ignore next */ params => params !== 'NEW');
        if (value) {
          this.params = this.params.delete('state');
          if (params?.length) {
            this.params = this.params.set('state', [...params, 'NEW'].join(','));
          }

          this.tableView.loadData(false, this.params);
        } else {
          this.params = this.params.delete('state');
          if (params?.length) {
            this.params = this.params.set('state', params.join(','));
          }
          this.tableView.loadData(false, this.params);
        }
      }
    );

    this.progressCheckbox.value$.pipe(untilDestroyed(this), skip(1), debounceTime(500)).subscribe(
      /* istanbul ignore next */ value => {
        const params = this.params
          .getAll('state')?.[0]
          .split(',')
          .filter(/* istanbul ignore next */ params => params !== 'PROG');
        if (value) {
          this.params = this.params.delete('state');
          if (params?.length) {
            this.params = this.params.set('state', [...params, 'PROG'].join(','));
          }

          this.tableView.loadData(false, this.params);
        } else {
          this.params = this.params.delete('state');
          if (params?.length) {
            this.params = this.params.set('state', params.join(','));
          }
          this.tableView.loadData(false, this.params);
        }
      }
    );

    this.doneCheckbox.value$.pipe(untilDestroyed(this), skip(1), debounceTime(500)).subscribe(
      /* istanbul ignore next */ value => {
        const params = this.params
          .getAll('state')?.[0]
          .split(',')
          .filter(/* istanbul ignore next */ params => params !== 'DONE');
        if (value) {
          this.params = this.params.delete('state');
          if (params?.length) {
            this.params = this.params.set('state', [...params, 'DONE'].join(','));
          }

          this.tableView.loadData(false, this.params);
        } else {
          this.params = this.params.delete('state');
          if (params?.length) {
            this.params = this.params.set('state', params.join(','));
          }
          this.tableView.loadData(false, this.params);
        }
      }
    );

    this.favoritesControl.value$.pipe(untilDestroyed(this), skip(1), debounceTime(500)).subscribe(
      /* istanbul ignore next */ value => {
        if (value) {
          this.params = this.params.set('favourite', value);
          this.tableView.loadData(false, this.params);
        } else {
          this.params = this.params.delete('favourite');
          this.tableView.loadData(false, this.params);
        }
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

    this.assigneesInput$
      .pipe(
        untilDestroyed(this),
        debounceTime(500),
        switchMap(/* istanbul ignore next */ input => (input ? this.userService.search(input) : of([])))
      )
      .subscribe(
        /* istanbul ignore next */ users => {
          if (users.length) {
            this.assignees = [...users];
            this.cdr.markForCheck();
          }
        }
      );

    this.projectsInput$
      .pipe(
        untilDestroyed(this),
        debounceTime(500),
        switchMap(/* istanbul ignore next */ input => (input ? this.projectsService.search(input) : of([...this.favoriteProjects])))
      )
      .subscribe(
        /* istanbul ignore next */ projects => {
          if (projects.length) {
            this.projects = [...projects].sort((a, b) => Number(b.is_favourite) - Number(a.is_favourite));
            this.cdr.markForCheck();
          }
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
    this.params = new HttpParams().set('state', 'NEW,PROG').set('priority', 'VHIGH,HIGH,NORM,LOW,VLOW');

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

    this.doneCheckbox.setValue(false, { emitEvent: false });
    this.doneCheckbox.markAsPristine();

    this.favoritesControl.setValue(null);
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
