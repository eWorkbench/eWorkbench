/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpParams } from '@angular/common/http';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { ModalState } from '@app/enums/modal-state.enum';
import { AuthService, PageTitleService, ProjectsService } from '@app/services';
import { UserService } from '@app/stores/user';
import { TableColumn, TableColumnChangedEvent, TreeViewComponent } from '@eworkbench/table';
import type { ModalCallback, User } from '@eworkbench/types';
import { DialogRef, DialogService } from '@ngneat/dialog';
import { FormBuilder } from '@ngneat/reactive-forms';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { keyBy, merge, values } from 'lodash';
import { of, Subject } from 'rxjs';
import { debounceTime, skip, switchMap, take } from 'rxjs/operators';
import { NewProjectModalComponent } from '../modals/new/new.component';

@UntilDestroy()
@Component({
  selector: 'eworkbench-projects-page',
  templateUrl: './projects-page.component.html',
  styleUrls: ['./projects-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectsPageComponent implements OnInit {
  public title = '';

  public currentUser: User | null = null;

  public defaultColumns: TableColumn[] = [];

  public listColumns: TableColumn[] = [];

  @ViewChild('treeView')
  public treeView!: TreeViewComponent;

  @ViewChild('nameCellTemplate', { static: true })
  public nameCellTemplate!: TemplateRef<any>;

  @ViewChild('progressCellTemplate', { static: true })
  public progressCellTemplate!: TemplateRef<any>;

  @ViewChild('startDateCellTemplate', { static: true })
  public startDateCellTemplate!: TemplateRef<any>;

  @ViewChild('stopDateCellTemplate', { static: true })
  public stopDateCellTemplate!: TemplateRef<any>;

  @ViewChild('taskStatusCellTemplate', { static: true })
  public taskStatusCellTemplate!: TemplateRef<any>;

  @ViewChild('projectStateCellTemplate', { static: true })
  public projectStateCellTemplate!: TemplateRef<any>;

  @ViewChild('actionsCellTemplate', { static: true })
  public actionsCellTemplate!: TemplateRef<any>;

  public state: Record<string, string> = {};

  public usersControl = this.fb.control<number | null>(null);

  public searchControl = this.fb.control<string | null>(null);

  public newCheckbox = this.fb.control<boolean>(true);

  public progressCheckbox = this.fb.control<boolean>(true);

  public finishedCheckbox = this.fb.control<boolean>(true);

  public pausedCheckbox = this.fb.control<boolean>(true);

  public cancelledCheckbox = this.fb.control<boolean>(true);

  public deletedCheckbox = this.fb.control<boolean>(true);

  public favoritesControl = this.fb.control<boolean | null>(null);

  public params = new HttpParams().set('parent_projects_and_orphans', 'true').set('project_state', 'INIT,START,FIN,PAUSE,CANCE,DEL');

  public users: User[] = [];

  public usersInput$ = new Subject<string>();

  public modalRef?: DialogRef;

  public expandable = true;

  public showUserFilter = false;

  public savedFilters = false;

  public constructor(
    public readonly projectsService: ProjectsService,
    public readonly translocoService: TranslocoService,
    private readonly router: Router,
    private readonly modalService: DialogService,
    private readonly pageTitleService: PageTitleService,
    private readonly titleService: Title,
    private readonly userService: UserService,
    private readonly authService: AuthService,
    private readonly cdr: ChangeDetectorRef,
    private readonly fb: FormBuilder,
    private readonly route: ActivatedRoute
  ) {}

  public get filtersChanged(): boolean {
    /* eslint-disable */
    return Boolean(
      this.usersControl.value ||
        this.searchControl.value ||
        this.newCheckbox.dirty ||
        this.progressCheckbox.dirty ||
        this.finishedCheckbox.dirty ||
        this.pausedCheckbox.dirty ||
        this.cancelledCheckbox.dirty ||
        this.deletedCheckbox.dirty ||
        this.favoritesControl.value
    );
    /* eslint-enable */
  }

  public get getFilterSelectedUser(): User | undefined {
    return this.users.find(user => user.pk === this.usersControl.value);
  }

  public ngOnInit(): void {
    this.authService.user$.pipe(untilDestroyed(this)).subscribe(state => {
      this.currentUser = state.user;
    });

    this.initTranslations();
    this.initSearch();
    this.initSearchInput();
    this.initPageTitle();
    void this.pageTitleService.set(this.title);
  }

  public initTranslations(): void {
    this.translocoService
      .selectTranslate('projects.title')
      .pipe(untilDestroyed(this))
      .subscribe(title => {
        this.title = title;
        void this.pageTitleService.set(title);
      });

    this.translocoService
      .selectTranslateObject('projects.columns')
      .pipe(untilDestroyed(this))
      .subscribe(column => {
        this.defaultColumns = [
          {
            cellTemplate: this.nameCellTemplate,
            name: column.name,
            key: 'name',
            sortable: true,
            width: '33%',
          },
          {
            cellTemplate: this.progressCellTemplate,
            name: column.progress,
            key: 'progress',
          },
          {
            cellTemplate: this.startDateCellTemplate,
            name: column.startDate,
            key: 'start_date',
            sortable: true,
          },
          {
            cellTemplate: this.stopDateCellTemplate,
            name: column.stopDate,
            key: 'stop_date',
            sortable: true,
          },
          {
            cellTemplate: this.taskStatusCellTemplate,
            name: column.done,
            key: 'tasks_status',
          },
          {
            cellTemplate: this.projectStateCellTemplate,
            name: column.status,
            key: 'project_state',
            sortable: true,
          },
          {
            cellTemplate: this.actionsCellTemplate,
            name: '',
            key: 'actions',
            hideable: false,
          },
        ];

        if (this.currentUser?.userprofile.ui_settings?.tables?.projects) {
          const merged = merge(
            keyBy(this.currentUser.userprofile.ui_settings.tables.projects, 'key'),
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

        if (this.currentUser?.userprofile.ui_settings?.filter_settings?.projects) {
          const filters = this.currentUser.userprofile.ui_settings?.filter_settings?.projects;

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
            this.params = this.params.delete('parent_projects_and_orphans').set('created_by', filters.users);
          }

          if (filters.search) {
            this.searchControl.setValue(filters.search);
            this.params = this.params.delete('parent_projects_and_orphans').set('search', filters.search);
          }

          if (filters.state?.length) {
            if (filters.state.includes('INIT')) {
              this.newCheckbox.setValue(true);
            } else {
              this.newCheckbox.setValue(false);
            }

            if (filters.state.includes('START')) {
              this.progressCheckbox.setValue(true);
            } else {
              this.progressCheckbox.setValue(false);
            }

            if (filters.state.includes('FIN')) {
              this.finishedCheckbox.setValue(true);
            } else {
              this.finishedCheckbox.setValue(false);
            }

            if (filters.state.includes('PAUSE')) {
              this.pausedCheckbox.setValue(true);
            } else {
              this.pausedCheckbox.setValue(false);
            }

            if (filters.state.includes('CANCE')) {
              this.cancelledCheckbox.setValue(true);
            } else {
              this.cancelledCheckbox.setValue(false);
            }

            if (filters.state.includes('DEL')) {
              this.deletedCheckbox.setValue(true);
            } else {
              this.deletedCheckbox.setValue(false);
            }

            this.params = this.params.delete('parent_projects_and_orphans').set('state', filters.state.join(','));
          }

          if (filters.favorites) {
            this.favoritesControl.setValue(Boolean(filters.favorites));
            this.params = this.params.delete('parent_projects_and_orphans').set('favourite', filters.favorites);
          }

          if (filters.active) {
            this.treeView.loadData(false, this.params);
          }
        }
      });

    this.translocoService
      .selectTranslateObject('projects.state')
      .pipe(untilDestroyed(this))
      .subscribe(state => {
        this.state = {
          INIT: state.new,
          START: state.inProgress,
          FIN: state.done,
          PAUSE: state.paused,
          CANCE: state.canceled,
        };
      });
  }

  public initSearch(): void {
    this.usersControl.value$.pipe(untilDestroyed(this), skip(1), debounceTime(500)).subscribe(value => {
      const queryParams = new URLSearchParams(window.location.search);

      if (value) {
        this.params = this.params.delete('parent_projects_and_orphans').set('created_by', value);
        this.treeView.loadData(false, this.params);
        queryParams.set('users', value.toString());
        history.pushState(null, '', `${window.location.pathname}?${queryParams.toString()}`);
      } else {
        this.params = this.params.delete('created_by');
        this.treeView.loadData(false, this.params);
        queryParams.delete('users');
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
        this.params = this.params.delete('parent_projects_and_orphans').set('search', value);
        this.treeView.loadData(false, this.params);
        queryParams.set('search', value);
        history.pushState(null, '', `${window.location.pathname}?${queryParams.toString()}`);
      } else {
        this.params = this.params.delete('search');
        this.treeView.loadData(false, this.params);
        queryParams.delete('search');
        history.pushState(null, '', `${window.location.pathname}?${queryParams.toString()}`);
      }

      if (this.savedFilters) {
        this.onSaveFilters(true);
      } else {
        this.onSaveFilters(false);
      }
    });

    this.newCheckbox.value$.pipe(untilDestroyed(this), skip(1), debounceTime(500)).subscribe(value => {
      const params = this.params
        .getAll('project_state')?.[0]
        .split(',')
        .filter(params => params !== 'INIT');
      if (value) {
        this.params = this.params.delete('project_state');
        if (params?.length) {
          this.params = this.params.delete('parent_projects_and_orphans').set('project_state', [...params, 'INIT'].join(','));
        }

        this.treeView.loadData(false, this.params);
      } else {
        this.params = this.params.delete('project_state');
        if (params?.length) {
          this.params = this.params.set('project_state', params.join(','));
        }
        this.treeView.loadData(false, this.params);
      }

      if (this.savedFilters) {
        this.onSaveFilters(true);
      } else {
        this.onSaveFilters(false);
      }
    });

    this.progressCheckbox.value$.pipe(untilDestroyed(this), skip(1), debounceTime(500)).subscribe(value => {
      const params = this.params
        .getAll('project_state')?.[0]
        .split(',')
        .filter(params => params !== 'START');
      if (value) {
        this.params = this.params.delete('project_state');
        if (params?.length) {
          this.params = this.params.delete('parent_projects_and_orphans').set('project_state', [...params, 'START'].join(','));
        }

        this.treeView.loadData(false, this.params);
      } else {
        this.params = this.params.delete('project_state');
        if (params?.length) {
          this.params = this.params.set('project_state', params.join(','));
        }
        this.treeView.loadData(false, this.params);
      }

      if (this.savedFilters) {
        this.onSaveFilters(true);
      } else {
        this.onSaveFilters(false);
      }
    });

    this.finishedCheckbox.value$.pipe(untilDestroyed(this), skip(1), debounceTime(500)).subscribe(value => {
      const params = this.params
        .getAll('project_state')?.[0]
        .split(',')
        .filter(params => params !== 'FIN');
      if (value) {
        this.params = this.params.delete('project_state');
        if (params?.length) {
          this.params = this.params.delete('parent_projects_and_orphans').set('project_state', [...params, 'FIN'].join(','));
        }

        this.treeView.loadData(false, this.params);
      } else {
        this.params = this.params.delete('project_state');
        if (params?.length) {
          this.params = this.params.set('project_state', params.join(','));
        }
        this.treeView.loadData(false, this.params);
      }

      if (this.savedFilters) {
        this.onSaveFilters(true);
      } else {
        this.onSaveFilters(false);
      }
    });

    this.pausedCheckbox.value$.pipe(untilDestroyed(this), skip(1), debounceTime(500)).subscribe(value => {
      const params = this.params
        .getAll('project_state')?.[0]
        .split(',')
        .filter(params => params !== 'PAUSE');
      if (value) {
        this.params = this.params.delete('project_state');
        if (params?.length) {
          this.params = this.params.delete('parent_projects_and_orphans').set('project_state', [...params, 'PAUSE'].join(','));
        }

        this.treeView.loadData(false, this.params);
      } else {
        this.params = this.params.delete('project_state');
        if (params?.length) {
          this.params = this.params.set('project_state', params.join(','));
        }
        this.treeView.loadData(false, this.params);
      }

      if (this.savedFilters) {
        this.onSaveFilters(true);
      } else {
        this.onSaveFilters(false);
      }
    });

    this.cancelledCheckbox.value$.pipe(untilDestroyed(this), skip(1), debounceTime(500)).subscribe(value => {
      const params = this.params
        .getAll('project_state')?.[0]
        .split(',')
        .filter(params => params !== 'CANCE');
      if (value) {
        this.params = this.params.delete('project_state');
        if (params?.length) {
          this.params = this.params.delete('parent_projects_and_orphans').set('project_state', [...params, 'CANCE'].join(','));
        }

        this.treeView.loadData(false, this.params);
      } else {
        this.params = this.params.delete('project_state');
        if (params?.length) {
          this.params = this.params.set('project_state', params.join(','));
        }
        this.treeView.loadData(false, this.params);
      }

      if (this.savedFilters) {
        this.onSaveFilters(true);
      } else {
        this.onSaveFilters(false);
      }
    });

    this.deletedCheckbox.value$.pipe(untilDestroyed(this), skip(1), debounceTime(500)).subscribe(value => {
      const params = this.params
        .getAll('project_state')?.[0]
        .split(',')
        .filter(params => params !== 'DEL');
      if (value) {
        this.params = this.params.delete('project_state');
        if (params?.length) {
          this.params = this.params.delete('parent_projects_and_orphans').set('project_state', [...params, 'DEL'].join(','));
        }

        this.treeView.loadData(false, this.params);
      } else {
        this.params = this.params.delete('project_state');
        if (params?.length) {
          this.params = this.params.set('project_state', params.join(','));
        }
        this.treeView.loadData(false, this.params);
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
        this.params = this.params.delete('parent_projects_and_orphans').set('favourite', value);
        this.treeView.loadData(false, this.params);
        queryParams.set('favorites', value.toString());
        history.pushState(null, '', `${window.location.pathname}?${queryParams.toString()}`);
      } else {
        this.params = this.params.delete('favourite');
        this.treeView.loadData(false, this.params);
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
      this.params = this.params.set('deleted', 'true').delete('parent_projects_and_orphans');
      this.expandable = false;
    } else {
      this.params = this.params.delete('deleted').set('parent_projects_and_orphans', 'true');
      this.expandable = true;
    }
    this.treeView.loadData(false, this.params);
    this.cdr.markForCheck();
  }

  public onRestore(restored: boolean): void {
    if (restored) {
      this.treeView.loadData(false, this.params);
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
    const settings = this.listColumns.map(col => ({ key: col.key, sort: col.sort, hidden: col.hidden }));

    this.authService.user$
      .pipe(
        untilDestroyed(this),
        take(1),
        switchMap(state => {
          const currentUser = state.user;
          return this.userService.changeSettings({
            userprofile: {
              ui_settings: {
                ...currentUser?.userprofile.ui_settings,
                tables: {
                  ...currentUser?.userprofile.ui_settings?.tables,
                  projects: settings,
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
                    projects: {
                      active: true,
                      users: this.usersControl.value,
                      search: this.searchControl.value,
                      state: this.params.getAll('project_state')?.[0].split(',') ?? [],
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
                    projects: {
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

  public onUserFilterRadioMyself(checked: boolean): void {
    if (checked && this.currentUser) {
      this.showUserFilter = false;
      this.users = [this.currentUser];
    }
  }

  public onResetFilters(): void {
    this.params = new HttpParams().set('parent_projects_and_orphans', 'true').set('project_state', 'INIT,START,FIN,PAUSE,CANCE,DEL');
    history.pushState(null, '', window.location.pathname);

    this.usersControl.setValue(null, { emitEvent: false });
    this.users = [];

    this.searchControl.setValue(null, { emitEvent: false });

    this.newCheckbox.setValue(true, { emitEvent: false });
    this.newCheckbox.markAsPristine();

    this.progressCheckbox.setValue(true, { emitEvent: false });
    this.progressCheckbox.markAsPristine();

    this.finishedCheckbox.setValue(true, { emitEvent: false });
    this.finishedCheckbox.markAsPristine();

    this.pausedCheckbox.setValue(true, { emitEvent: false });
    this.pausedCheckbox.markAsPristine();

    this.cancelledCheckbox.setValue(true, { emitEvent: false });
    this.cancelledCheckbox.markAsPristine();

    this.deletedCheckbox.setValue(true, { emitEvent: false });
    this.deletedCheckbox.markAsPristine();

    this.favoritesControl.setValue(null);
  }

  public openNewModal(): void {
    this.modalRef = this.modalService.open(NewProjectModalComponent, { closeButton: false });

    this.modalRef.afterClosed$.pipe(untilDestroyed(this), take(1)).subscribe((callback: ModalCallback) => this.onModalClose(callback));
  }

  public onModalClose(callback?: ModalCallback): void {
    if (callback?.navigate) {
      void this.router.navigate(callback.navigate);
    } else if (callback?.state === ModalState.Changed) {
      this.treeView.loadData();
    }
  }
}
