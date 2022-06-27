/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpParams } from '@angular/common/http';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { ModalState } from '@app/enums/modal-state.enum';
import { ProjectSidebarItem } from '@app/enums/project-sidebar-item.enum';
import { NewTaskModalComponent } from '@app/modules/task/components/modals/new/new.component';
import { LeaveProjectModalComponent } from '@app/pages/projects/components/modals/leave/leave.component';
import { AuthService, PageTitleService, ProjectsService, TasksService } from '@app/services';
import { UserService, UserStore } from '@app/stores/user';
import { TableColumn, TableColumnChangedEvent, TableSortChangedEvent, TableViewComponent } from '@eworkbench/table';
import type { ModalCallback, Project, User } from '@eworkbench/types';
import { DialogRef, DialogService } from '@ngneat/dialog';
import { FormBuilder } from '@ngneat/reactive-forms';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { keyBy, merge, values } from 'lodash';
import { Observable, of, Subject } from 'rxjs';
import { debounceTime, map, skip, switchMap, take } from 'rxjs/operators';

@UntilDestroy()
@Component({
  templateUrl: './tasks-page.component.html',
  styleUrls: ['./tasks-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TasksPageComponent implements OnInit {
  public title = '';

  public currentUser: User | null = null;

  public defaultColumns: TableColumn[] = [];

  public listColumns: TableColumn[] = [];

  public sidebarItem = ProjectSidebarItem.Tasks;

  @ViewChild('tableView', { static: true })
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

  @ViewChild('assignedToCellTemplate', { static: true })
  public assignedToCellTemplate!: TemplateRef<any>;

  @ViewChild('actionsCellTemplate', { static: true })
  public actionsCellTemplate!: TemplateRef<any>;

  public modalRef?: DialogRef;

  public priority: Record<string, string> = {};

  public state: Record<string, string> = {};

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

  public params = new HttpParams().set('state', 'NEW,PROG,DONE').set('priority', '1,2,3,4,5');

  public users: User[] = [];

  public assignees: User[] = [];

  public usersInput$ = new Subject<string>();

  public assigneesInput$ = new Subject<string>();

  public projects: Project[] = [];

  public favoriteProjects: Project[] = [];

  public projectsInput$ = new Subject<string>();

  public showSidebar = false;

  public project?: string;

  public sorting?: TableSortChangedEvent;

  public showUserFilter = false;

  public showAssigneesFilter = false;

  public savedFilters = false;

  public constructor(
    public readonly tasksService: TasksService,
    private readonly router: Router,
    private readonly modalService: DialogService,
    private readonly cdr: ChangeDetectorRef,
    private readonly translocoService: TranslocoService,
    private readonly fb: FormBuilder,
    private readonly route: ActivatedRoute,
    private readonly projectsService: ProjectsService,
    private readonly userService: UserService,
    private readonly pageTitleService: PageTitleService,
    private readonly titleService: Title,
    private readonly authService: AuthService,
    private readonly userStore: UserStore
  ) {}

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

  public get getFilterSelectedAssignee(): User | undefined {
    return this.assignees.find(user => user.pk === this.assigneesControl.value);
  }

  public get getFilterSelectedProject(): Project | undefined {
    return this.projects.find(project => project.pk === this.projectsControl.value);
  }

  public ngOnInit(): void {
    this.authService.user$.pipe(untilDestroyed(this)).subscribe(state => {
      this.currentUser = state.user;
    });

    this.initTranslations(this.showSidebar);
    this.initSidebar();
    this.initSearch(this.showSidebar);
    this.initSearchInput();
    this.initPageTitle();
    void this.pageTitleService.set(this.title);
  }

  public initTranslations(project = false): void {
    this.translocoService
      .selectTranslate('tasks.title')
      .pipe(untilDestroyed(this))
      .subscribe(title => {
        this.title = title;
        void this.pageTitleService.set(title);
      });

    this.translocoService
      .selectTranslateObject('tasks.columns')
      .pipe(untilDestroyed(this))
      .subscribe(column => {
        this.defaultColumns = [
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
            width: '20%',
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
            cellTemplate: this.assignedToCellTemplate,
            name: column.assignedTo,
            key: 'assigned_users',
          },
          {
            cellTemplate: this.actionsCellTemplate,
            name: '',
            key: 'actions',
            hideable: false,
          },
        ];

        if (this.currentUser?.userprofile.ui_settings?.tables?.tasks) {
          const merged = merge(
            keyBy(this.currentUser.userprofile.ui_settings.tables.tasks, 'key'),
            keyBy(
              this.defaultColumns.map(column => ({
                cellTemplate: column.cellTemplate,
                name: column.name,
                key: column.key,
                sortable: column.sortable,
                hideable: column.hidden,
                width: column.width,
              })),
              'key'
            )
          );
          this.listColumns = values(merged);
        } else {
          this.listColumns = [...this.defaultColumns];
        }

        if (this.currentUser?.userprofile.ui_settings?.tables_sort?.tasks) {
          this.sorting = this.currentUser.userprofile.ui_settings.tables_sort.tasks;
        }

        if (this.currentUser?.userprofile.ui_settings?.filter_settings?.tasks) {
          const filters = this.currentUser.userprofile.ui_settings?.filter_settings?.tasks;

          if (filters.active) {
            this.savedFilters = true;
          }

          if (filters.users) {
            this.userService
              .getUserById(filters.users)
              .pipe(untilDestroyed(this))
              .subscribe(users => {
                if (users.length) {
                  this.users = [...users];
                  this.cdr.markForCheck();
                }
              });
            this.usersControl.setValue(filters.users);
            this.params = this.params.set('created_by', filters.users);
          }

          if (filters.assignees) {
            this.userService
              .getUserById(filters.assignees)
              .pipe(untilDestroyed(this))
              .subscribe(users => {
                if (users.length) {
                  this.assignees = [...users];
                  this.cdr.markForCheck();
                }
              });
            this.assigneesControl.setValue(filters.assignees);
            this.params = this.params.set('assigned_users', filters.assignees);
          }

          if (filters.projects && !project) {
            this.projectsService
              .get(filters.projects)
              .pipe(untilDestroyed(this))
              .subscribe(project => {
                this.projects = [...this.projects, project];
                this.cdr.markForCheck();
              });
            this.projectsControl.setValue(filters.projects);
            this.params = this.params.set('projects_recursive', filters.projects);
          }

          if (filters.search) {
            this.searchControl.setValue(filters.search);
            this.params = this.params.set('search', filters.search);
          }

          if (filters.priority?.length) {
            if (filters.priority.includes('1')) {
              this.veryHighCheckbox.setValue(true);
            } else {
              this.veryHighCheckbox.setValue(false);
            }

            if (filters.priority.includes('2')) {
              this.highCheckbox.setValue(true);
            } else {
              this.highCheckbox.setValue(false);
            }

            if (filters.priority.includes('3')) {
              this.normalCheckbox.setValue(true);
            } else {
              this.normalCheckbox.setValue(false);
            }

            if (filters.priority.includes('4')) {
              this.lowCheckbox.setValue(true);
            } else {
              this.lowCheckbox.setValue(false);
            }

            if (filters.priority.includes('5')) {
              this.veryLowCheckbox.setValue(true);
            } else {
              this.veryLowCheckbox.setValue(false);
            }

            this.params = this.params.set('priority', filters.priority.join(','));
          }

          if (filters.state?.length) {
            if (filters.state.includes('NEW')) {
              this.newCheckbox.setValue(true);
            } else {
              this.newCheckbox.setValue(false);
            }

            if (filters.state.includes('PROG')) {
              this.progressCheckbox.setValue(true);
            } else {
              this.progressCheckbox.setValue(false);
            }

            if (filters.state.includes('DONE')) {
              this.doneCheckbox.setValue(true);
            } else {
              this.doneCheckbox.setValue(false);
            }

            this.params = this.params.set('state', filters.state.join(','));
          }

          if (filters.favorites) {
            this.favoritesControl.setValue(Boolean(filters.favorites));
            this.params = this.params.set('favourite', filters.favorites);
          }

          if (filters.active) {
            this.tableView.loadData(false, this.params);
          }
        }
      });

    this.translocoService
      .selectTranslateObject('tasks')
      .pipe(untilDestroyed(this))
      .subscribe(tasks => {
        this.priority = {
          5: tasks.priority.veryHigh,
          4: tasks.priority.high,
          3: tasks.priority.normal,
          2: tasks.priority.low,
          1: tasks.priority.veryLow,
        };

        this.state = {
          NEW: tasks.state.new,
          PROG: tasks.state.inProgress,
          DONE: tasks.state.done,
        };
      });
  }

  public initSidebar(): void {
    this.route.params.subscribe(params => {
      if (params.projectId) {
        this.showSidebar = true;

        this.projectsService.get(params.projectId).subscribe(project => {
          this.projects = [...this.projects, project]
            .filter((value, index, array) => array.map(project => project.pk).indexOf(value.pk) === index)
            .sort((a, b) => Number(b.is_favourite) - Number(a.is_favourite));
          this.projectsControl.setValue(params.projectId);
          this.project = params.projectId;
          this.cdr.markForCheck();
        });
      }
    });
  }

  public initSearch(project = false): void {
    this.projectsControl.value$.pipe(untilDestroyed(this), skip(1), debounceTime(500)).subscribe(value => {
      const queryParams = new URLSearchParams(window.location.search);

      if (value) {
        this.params = this.params.set('projects_recursive', value);
        this.tableView.loadData(false, this.params);
        if (!project) {
          queryParams.set('projects', value);
          history.pushState(null, '', `${window.location.pathname}?${queryParams.toString()}`);
        }
      } else {
        this.params = this.params.delete('projects_recursive');
        this.tableView.loadData(false, this.params);
        if (!project) {
          queryParams.delete('projects');
          history.pushState(null, '', `${window.location.pathname}?${queryParams.toString()}`);
        }
      }

      if (this.savedFilters) {
        this.onSaveFilters(true);
      } else {
        this.onSaveFilters(false);
      }
    });

    this.usersControl.value$.pipe(untilDestroyed(this), skip(1), debounceTime(500)).subscribe(value => {
      const queryParams = new URLSearchParams(window.location.search);

      if (value) {
        this.params = this.params.set('created_by', value);
        this.tableView.loadData(false, this.params);
        queryParams.set('users', value.toString());
        history.pushState(null, '', `${window.location.pathname}?${queryParams.toString()}`);
      } else {
        this.params = this.params.delete('created_by');
        this.tableView.loadData(false, this.params);
        queryParams.delete('users');
        history.pushState(null, '', `${window.location.pathname}?${queryParams.toString()}`);
      }

      if (this.savedFilters) {
        this.onSaveFilters(true);
      } else {
        this.onSaveFilters(false);
      }
    });

    this.assigneesControl.value$.pipe(untilDestroyed(this), skip(1), debounceTime(500)).subscribe(value => {
      const queryParams = new URLSearchParams(window.location.search);

      if (value) {
        this.params = this.params.set('assigned_users', value);
        this.tableView.loadData(false, this.params);
        queryParams.set('assignees', value.toString());
        history.pushState(null, '', `${window.location.pathname}?${queryParams.toString()}`);
      } else {
        this.params = this.params.delete('assigned_users');
        this.tableView.loadData(false, this.params);
        queryParams.delete('assignees');
        history.pushState(null, '', `${window.location.pathname}?${queryParams.toString()}`);
      }

      if (this.savedFilters) {
        this.onSaveFilters(true);
      } else {
        this.onSaveFilters(false);
      }
    });

    this.searchControl.value$.pipe(untilDestroyed(this), skip(1), debounceTime(500)).subscribe(value => {
      const queryParams = new URLSearchParams(window.location.search);

      if (value) {
        this.params = this.params.set('search', value);
        this.tableView.loadData(false, this.params);
        queryParams.set('search', value);
        history.pushState(null, '', `${window.location.pathname}?${queryParams.toString()}`);
      } else {
        this.params = this.params.delete('search');
        this.tableView.loadData(false, this.params);
        queryParams.delete('search');
        history.pushState(null, '', `${window.location.pathname}?${queryParams.toString()}`);
      }

      if (this.savedFilters) {
        this.onSaveFilters(true);
      } else {
        this.onSaveFilters(false);
      }
    });

    this.veryHighCheckbox.value$.pipe(untilDestroyed(this), skip(1), debounceTime(500)).subscribe(value => {
      const params = this.params
        .getAll('priority')?.[0]
        .split(',')
        .filter(params => params !== '1');
      if (value) {
        this.params = this.params.delete('priority');
        if (params?.length) {
          this.params = this.params.set('priority', [...params, '1'].join(','));
        }

        this.tableView.loadData(false, this.params);
      } else {
        this.params = this.params.delete('priority');
        if (params?.length) {
          this.params = this.params.set('priority', params.join(','));
        }
        this.tableView.loadData(false, this.params);
      }

      if (this.savedFilters) {
        this.onSaveFilters(true);
      } else {
        this.onSaveFilters(false);
      }
    });

    this.highCheckbox.value$.pipe(untilDestroyed(this), skip(1), debounceTime(500)).subscribe(value => {
      const params = this.params
        .getAll('priority')?.[0]
        .split(',')
        .filter(params => params !== '2');
      if (value) {
        this.params = this.params.delete('priority');
        if (params?.length) {
          this.params = this.params.set('priority', [...params, '2'].join(','));
        }

        this.tableView.loadData(false, this.params);
      } else {
        this.params = this.params.delete('priority');
        if (params?.length) {
          this.params = this.params.set('priority', params.join(','));
        }
        this.tableView.loadData(false, this.params);
      }

      if (this.savedFilters) {
        this.onSaveFilters(true);
      } else {
        this.onSaveFilters(false);
      }
    });

    this.normalCheckbox.value$.pipe(untilDestroyed(this), skip(1), debounceTime(500)).subscribe(value => {
      const params = this.params
        .getAll('priority')?.[0]
        .split(',')
        .filter(params => params !== '3');
      if (value) {
        this.params = this.params.delete('priority');
        if (params?.length) {
          this.params = this.params.set('priority', [...params, '3'].join(','));
        }

        this.tableView.loadData(false, this.params);
      } else {
        this.params = this.params.delete('priority');
        if (params?.length) {
          this.params = this.params.set('priority', params.join(','));
        }
        this.tableView.loadData(false, this.params);
      }

      if (this.savedFilters) {
        this.onSaveFilters(true);
      } else {
        this.onSaveFilters(false);
      }
    });

    this.lowCheckbox.value$.pipe(untilDestroyed(this), skip(1), debounceTime(500)).subscribe(value => {
      const params = this.params
        .getAll('priority')?.[0]
        .split(',')
        .filter(params => params !== '4');
      if (value) {
        this.params = this.params.delete('priority');
        if (params?.length) {
          this.params = this.params.set('priority', [...params, '4'].join(','));
        }

        this.tableView.loadData(false, this.params);
      } else {
        this.params = this.params.delete('priority');
        if (params?.length) {
          this.params = this.params.set('priority', params.join(','));
        }
        this.tableView.loadData(false, this.params);
      }

      if (this.savedFilters) {
        this.onSaveFilters(true);
      } else {
        this.onSaveFilters(false);
      }
    });

    this.veryLowCheckbox.value$.pipe(untilDestroyed(this), skip(1), debounceTime(500)).subscribe(value => {
      const params = this.params
        .getAll('priority')?.[0]
        .split(',')
        .filter(params => params !== '5');
      if (value) {
        this.params = this.params.delete('priority');
        if (params?.length) {
          this.params = this.params.set('priority', [...params, '5'].join(','));
        }

        this.tableView.loadData(false, this.params);
      } else {
        this.params = this.params.delete('priority');
        if (params?.length) {
          this.params = this.params.set('priority', params.join(','));
        }
        this.tableView.loadData(false, this.params);
      }

      if (this.savedFilters) {
        this.onSaveFilters(true);
      } else {
        this.onSaveFilters(false);
      }
    });

    this.newCheckbox.value$.pipe(untilDestroyed(this), skip(1), debounceTime(500)).subscribe(value => {
      const params = this.params
        .getAll('state')?.[0]
        .split(',')
        .filter(params => params !== 'NEW');
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

      if (this.savedFilters) {
        this.onSaveFilters(true);
      } else {
        this.onSaveFilters(false);
      }
    });

    this.progressCheckbox.value$.pipe(untilDestroyed(this), skip(1), debounceTime(500)).subscribe(value => {
      const params = this.params
        .getAll('state')?.[0]
        .split(',')
        .filter(params => params !== 'PROG');
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

      if (this.savedFilters) {
        this.onSaveFilters(true);
      } else {
        this.onSaveFilters(false);
      }
    });

    this.doneCheckbox.value$.pipe(untilDestroyed(this), skip(1), debounceTime(500)).subscribe(value => {
      const params = this.params
        .getAll('state')?.[0]
        .split(',')
        .filter(params => params !== 'DONE');
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

      if (this.savedFilters) {
        this.onSaveFilters(true);
      } else {
        this.onSaveFilters(false);
      }
    });

    this.favoritesControl.value$.pipe(untilDestroyed(this), skip(1), debounceTime(500)).subscribe(value => {
      const queryParams = new URLSearchParams(window.location.search);

      if (value) {
        this.params = this.params.set('favourite', value);
        this.tableView.loadData(false, this.params);
        queryParams.set('favorites', value.toString());
        history.pushState(null, '', `${window.location.pathname}?${queryParams.toString()}`);
      } else {
        this.params = this.params.delete('favourite');
        this.tableView.loadData(false, this.params);
        queryParams.delete('favorites');
        history.pushState(null, '', `${window.location.pathname}?${queryParams.toString()}`);
      }

      if (this.savedFilters) {
        this.onSaveFilters(true);
      } else {
        this.onSaveFilters(false);
      }
    });

    this.route.queryParamMap.pipe(untilDestroyed(this), take(1)).subscribe(queryParams => {
      const users = queryParams.get('users');
      const assignees = queryParams.get('assignees');
      const projects = queryParams.get('projects');
      const search = queryParams.get('search');
      const favorites = queryParams.get('favorites');

      if (users) {
        this.userService
          .getUserById(users)
          .pipe(untilDestroyed(this))
          .subscribe(users => {
            if (users.length) {
              this.users = [...users];
              this.cdr.markForCheck();
            }
          });
        this.usersControl.setValue(Number(users));
      }

      if (assignees) {
        this.userService
          .getUserById(assignees)
          .pipe(untilDestroyed(this))
          .subscribe(users => {
            if (users.length) {
              this.assignees = [...users];
              this.cdr.markForCheck();
            }
          });
        this.usersControl.setValue(Number(users));
      }

      if (projects && !project) {
        this.projectsService
          .get(projects)
          .pipe(untilDestroyed(this))
          .subscribe(project => {
            this.projects = [...this.projects, project];
            this.cdr.markForCheck();
          });
        this.projectsControl.setValue(projects);
      }

      if (search) {
        this.searchControl.setValue(search);
      }

      if (favorites) {
        this.favoritesControl.setValue(Boolean(favorites));
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
        if (projects.length) {
          this.projects = [...projects].sort((a, b) => Number(b.is_favourite) - Number(a.is_favourite));
          this.cdr.markForCheck();
        }
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

  public initPageTitle(): void {
    this.pageTitleService
      .get()
      .pipe(untilDestroyed(this))
      .subscribe(title => {
        this.titleService.setTitle(title);
      });
  }

  public onFilterItems(showTrashedItems: boolean): void {
    if (showTrashedItems) {
      this.params = this.params.set('deleted', 'true');
    } else {
      this.params = this.params.delete('deleted');
    }
    this.tableView.loadData(false, this.params);
  }

  public onRestore(restored: boolean): void {
    if (restored) {
      this.tableView.loadData(false, this.params);
    }
  }

  public onColumnsChanged(event: TableColumnChangedEvent): void {
    const merged = merge(
      keyBy(event, 'key'),
      keyBy(
        this.defaultColumns.map(column => ({
          cellTemplate: column.cellTemplate,
          key: column.key,
        })),
        'key'
      )
    );

    this.listColumns = values<TableColumn>(merged);
    const settings = this.listColumns.map(col => ({
      key: col.key,
      sort: col.sort,
      hidden: col.hidden,
      hideable: col.hideable,
    }));

    this.userService
      .get()
      .pipe(
        untilDestroyed(this),
        take(1),
        switchMap(user => {
          const currentUser = user;
          return this.userService.changeSettings({
            userprofile: {
              ui_settings: {
                ...currentUser.userprofile.ui_settings,
                tables: {
                  ...currentUser.userprofile.ui_settings?.tables,
                  tasks: settings,
                },
              },
            },
          });
        })
      )
      .subscribe();
  }

  public onSortChanged(event: TableSortChangedEvent): void {
    this.userService
      .get()
      .pipe(
        untilDestroyed(this),
        take(1),
        switchMap(user => {
          const currentUser = user;
          return this.userService.changeSettings({
            userprofile: {
              ui_settings: {
                ...currentUser.userprofile.ui_settings,
                tables_sort: {
                  ...currentUser.userprofile.ui_settings?.tables_sort,
                  tasks: event,
                },
              },
            },
          });
        })
      )
      .subscribe();
  }

  public onSaveFilters(save: boolean): void {
    this.savedFilters = save;
    if (save) {
      this.userService
        .get()
        .pipe(
          untilDestroyed(this),
          take(1),
          switchMap(user => {
            const currentUser = user;
            return this.userService.changeSettings({
              userprofile: {
                ui_settings: {
                  ...currentUser.userprofile.ui_settings,
                  filter_settings: {
                    ...currentUser.userprofile.ui_settings?.filter_settings,
                    tasks: {
                      active: true,
                      users: this.usersControl.value,
                      assignees: this.assigneesControl.value,
                      projects: this.projectsControl.value,
                      search: this.searchControl.value,
                      priority: this.params.getAll('priority')?.[0].split(',') ?? [],
                      state: this.params.getAll('state')?.[0].split(',') ?? [],
                      favorites: this.favoritesControl.value,
                    },
                  },
                },
              },
            });
          })
        )
        .subscribe();
    } else {
      this.userService
        .get()
        .pipe(
          untilDestroyed(this),
          take(1),
          switchMap(user => {
            const currentUser = user;
            return this.userService.changeSettings({
              userprofile: {
                ui_settings: {
                  ...currentUser.userprofile.ui_settings,
                  filter_settings: {
                    ...currentUser.userprofile.ui_settings?.filter_settings,
                    tasks: {
                      active: false,
                    },
                  },
                },
              },
            });
          })
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
    this.params = new HttpParams().set('state', 'NEW,PROG,DONE').set('priority', '1,2,3,4,5');
    history.pushState(null, '', window.location.pathname);

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

  public openNewTaskModal(): void {
    const initialState = this.project ? { projects: [this.project] } : null;

    this.modalRef = this.modalService.open(NewTaskModalComponent, {
      closeButton: false,
      enableClose: false,
      data: { withSidebar: this.showSidebar, initialState: initialState },
    });

    this.modalRef.afterClosed$.pipe(untilDestroyed(this), take(1)).subscribe((callback: ModalCallback) => this.onModalClose(callback));
  }

  public onModalClose(callback?: ModalCallback): void {
    if (callback?.navigate) {
      void this.router.navigate(callback.navigate, { relativeTo: this.route });
    } else if (callback?.state === ModalState.Changed) {
      this.tableView.loadData();
    }
  }
}
