/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpParams } from '@angular/common/http';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { ModalState } from '@app/enums/modal-state.enum';
import { AuthService, NotesService, PageTitleService, ProjectsService } from '@app/services';
import { UserService } from '@app/stores/user';
import { TableColumn, TableColumnChangedEvent, TableSortChangedEvent, TableViewComponent } from '@eworkbench/table';
import { ModalCallback, Project, User } from '@eworkbench/types';
import { DialogRef, DialogService } from '@ngneat/dialog';
import { FormBuilder } from '@ngneat/reactive-forms';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { keyBy, merge, values } from 'lodash';
import { of, Subject } from 'rxjs';
import { debounceTime, skip, switchMap, take } from 'rxjs/operators';
import { NewNoteModalComponent } from '../modals/new/new.component';

@UntilDestroy()
@Component({
  selector: 'eworkbench-notes-page',
  templateUrl: './notes-page.component.html',
  styleUrls: ['./notes-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotesPageComponent implements OnInit {
  public title = '';

  public currentUser: User | null = null;

  public defaultColumns: TableColumn[] = [];

  public listColumns: TableColumn[] = [];

  @ViewChild('tableView', { static: true })
  public tableView!: TableViewComponent;

  @ViewChild('subjectCellTemplate', { static: true })
  public subjectCellTemplate!: TemplateRef<any>;

  @ViewChild('createdAtCellTemplate', { static: true })
  public createdAtCellTemplate!: TemplateRef<any>;

  @ViewChild('createdByCellTemplate', { static: true })
  public createdByCellTemplate!: TemplateRef<any>;

  @ViewChild('actionsCellTemplate', { static: true })
  public actionsCellTemplate!: TemplateRef<any>;

  public modalRef?: DialogRef;

  public loading = false;

  public projectsControl = this.fb.control<string | null>(null);

  public usersControl = this.fb.control<number | null>(null);

  public searchControl = this.fb.control<string | null>(null);

  public favoritesControl = this.fb.control<boolean | null>(null);

  public params = new HttpParams();

  public users: User[] = [];

  public usersInput$ = new Subject<string>();

  public projects: Project[] = [];

  public favoriteProjects: Project[] = [];

  public projectsInput$ = new Subject<string>();

  public project?: string;

  public sorting?: TableSortChangedEvent;

  public showUserFilter = false;

  public savedFilters = false;

  public constructor(
    public readonly notesService: NotesService,
    private readonly router: Router,
    private readonly modalService: DialogService,
    private readonly translocoService: TranslocoService,
    private readonly cdr: ChangeDetectorRef,
    private readonly fb: FormBuilder,
    private readonly route: ActivatedRoute,
    private readonly projectsService: ProjectsService,
    private readonly userService: UserService,
    private readonly pageTitleService: PageTitleService,
    private readonly titleService: Title,
    private readonly authService: AuthService
  ) {}

  public get filtersChanged(): boolean {
    /* eslint-disable */
    return Boolean(this.projectsControl.value || this.usersControl.value || this.searchControl.value || this.favoritesControl.value);
    /* eslint-enable */
  }

  public get getFilterSelectedUser(): User | undefined {
    return this.users.find(user => user.pk === this.usersControl.value);
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
    this.initSidebar();
    this.initSearch();
    this.initSearchInput();
    this.initPageTitle();
    this.pageTitleService.set(this.title);
  }

  public initTranslations(): void {
    this.translocoService
      .selectTranslate('notes.title')
      .pipe(untilDestroyed(this))
      .subscribe(title => {
        this.title = title;
        this.pageTitleService.set(title);
      });

    this.translocoService
      .selectTranslateObject('notes.columns')
      .pipe(untilDestroyed(this))
      .subscribe(column => {
        this.defaultColumns = [
          {
            cellTemplate: this.subjectCellTemplate,
            name: column.subject,
            key: 'subject',
            sortable: true,
          },
          {
            cellTemplate: this.createdAtCellTemplate,
            name: column.createdAt,
            key: 'created_at',
            sortable: true,
          },
          {
            cellTemplate: this.createdByCellTemplate,
            name: column.createdBy,
            key: 'created_by',
            sortable: true,
          },
          {
            cellTemplate: this.actionsCellTemplate,
            name: '',
            key: 'actions',
            hideable: false,
          },
        ];

        if (this.currentUser?.userprofile.ui_settings?.tables?.notes) {
          const merged = merge(
            keyBy(this.currentUser.userprofile.ui_settings.tables.notes, 'key'),
            keyBy(
              this.defaultColumns.map(column => ({
                cellTemplate: column.cellTemplate,
                name: column.name,
                key: column.key,
                sortable: column.sortable,
                hideable: column.hidden,
              })),
              'key'
            )
          );
          this.listColumns = values(merged);
        } else {
          this.listColumns = [...this.defaultColumns];
        }

        if (this.currentUser?.userprofile.ui_settings?.tables_sort?.notes) {
          this.sorting = this.currentUser.userprofile.ui_settings.tables_sort.notes;
        }

        if (this.currentUser?.userprofile.ui_settings?.filter_settings?.notes) {
          const filters = this.currentUser.userprofile.ui_settings?.filter_settings?.notes;

          if (filters.active) {
            this.savedFilters = true;
          }

          if (filters.users) {
            this.userService
              .getUserById(filters.users)
              .pipe(untilDestroyed(this))
              .subscribe(
                /* istanbul ignore next */ users => {
                  if (users.length) {
                    this.users = [...users];
                    this.cdr.markForCheck();
                  }
                }
              );
            this.usersControl.setValue(filters.users);
            this.params = this.params.set('created_by', filters.users);
          }

          if (filters.projects) {
            this.projectsService
              .get(filters.projects)
              .pipe(untilDestroyed(this))
              .subscribe(
                /* istanbul ignore next */ project => {
                  this.projects = [...this.projects, project];
                  this.cdr.markForCheck();
                }
              );
            this.projectsControl.setValue(filters.projects);
            this.params = this.params.set('projects_recursive', filters.projects);
          }

          if (filters.search) {
            this.searchControl.setValue(filters.search);
            this.params = this.params.set('search', filters.search);
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
  }

  public initSidebar(): void {
    this.route.params.subscribe(params => {
      if (params.projectId) {
        this.projectsService.get(params.projectId).subscribe(
          /* istanbul ignore next */ project => {
            this.projects = [...this.projects, project]
              .filter((value, index, array) => array.map(project => project.pk).indexOf(value.pk) === index)
              .sort((a, b) => Number(b.is_favourite) - Number(a.is_favourite));
            this.projectsControl.setValue(params.projectId);
            this.project = params.projectId;
            this.cdr.markForCheck();
          }
        );
      }
    });
  }

  public initSearch(project = false): void {
    this.projectsControl.value$.pipe(untilDestroyed(this), skip(1), debounceTime(500)).subscribe(
      /* istanbul ignore next */ value => {
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
      }
    );

    this.usersControl.value$.pipe(untilDestroyed(this), skip(1), debounceTime(500)).subscribe(
      /* istanbul ignore next */ value => {
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
      }
    );

    this.searchControl.value$.pipe(untilDestroyed(this), skip(1), debounceTime(500)).subscribe(
      /* istanbul ignore next */ value => {
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
      }
    );

    this.favoritesControl.value$.pipe(untilDestroyed(this), skip(1), debounceTime(500)).subscribe(
      /* istanbul ignore next */ value => {
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
      }
    );

    this.route.queryParamMap.pipe(untilDestroyed(this), take(1)).subscribe(
      /* istanbul ignore next */ queryParams => {
        const users = queryParams.get('users');
        const projects = queryParams.get('projects');
        const search = queryParams.get('search');
        const favorites = queryParams.get('favorites');

        if (users) {
          this.userService
            .getUserById(users)
            .pipe(untilDestroyed(this))
            .subscribe(
              /* istanbul ignore next */ users => {
                if (users.length) {
                  this.users = [...users];
                  this.cdr.markForCheck();
                }
              }
            );
          this.usersControl.setValue(Number(users));
        }

        if (projects && !project) {
          this.projectsService
            .get(projects)
            .pipe(untilDestroyed(this))
            .subscribe(
              /* istanbul ignore next */ project => {
                this.projects = [...this.projects, project];
                this.cdr.markForCheck();
              }
            );
          this.projectsControl.setValue(projects);
        }

        if (search) {
          this.searchControl.setValue(search);
        }

        if (favorites) {
          this.favoritesControl.setValue(Boolean(favorites));
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

    this.listColumns = values(merged) as TableColumn[];
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
        switchMap(
          /* istanbul ignore next */ user => {
            const currentUser = user;
            return this.userService.changeSettings({
              userprofile: {
                ui_settings: {
                  ...currentUser.userprofile.ui_settings,
                  tables: {
                    ...currentUser.userprofile.ui_settings?.tables,
                    notes: settings,
                  },
                },
              },
            });
          }
        )
      )
      .subscribe();
  }

  public onSortChanged(event: TableSortChangedEvent): void {
    this.userService
      .get()
      .pipe(
        untilDestroyed(this),
        take(1),
        switchMap(
          /* istanbul ignore next */ user => {
            const currentUser = user;
            return this.userService.changeSettings({
              userprofile: {
                ui_settings: {
                  ...currentUser.userprofile.ui_settings,
                  tables_sort: {
                    ...currentUser.userprofile.ui_settings?.tables_sort,
                    notes: event,
                  },
                },
              },
            });
          }
        )
      )
      .subscribe();
  }

  public onSaveFilters(save: boolean): void {
    if (save) {
      this.userService
        .get()
        .pipe(
          untilDestroyed(this),
          take(1),
          switchMap(
            /* istanbul ignore next */ user => {
              const currentUser = user;
              return this.userService.changeSettings({
                userprofile: {
                  ui_settings: {
                    ...currentUser.userprofile.ui_settings,
                    filter_settings: {
                      ...currentUser.userprofile.ui_settings?.filter_settings,
                      notes: {
                        active: true,
                        users: this.usersControl.value,
                        projects: this.projectsControl.value,
                        search: this.searchControl.value,
                        favorites: this.favoritesControl.value,
                      },
                    },
                  },
                },
              });
            }
          )
        )
        .subscribe();
    } else {
      this.userService
        .get()
        .pipe(
          untilDestroyed(this),
          take(1),
          switchMap(
            /* istanbul ignore next */ user => {
              const currentUser = user;
              return this.userService.changeSettings({
                userprofile: {
                  ui_settings: {
                    ...currentUser.userprofile.ui_settings,
                    filter_settings: {
                      ...currentUser.userprofile.ui_settings?.filter_settings,
                      notes: {
                        active: false,
                      },
                    },
                  },
                },
              });
            }
          )
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
    this.params = new HttpParams();
    history.pushState(null, '', window.location.pathname);

    this.projectsControl.setValue(null, { emitEvent: false });
    this.projects = [];

    this.usersControl.setValue(null, { emitEvent: false });
    this.users = [];

    this.searchControl.setValue(null, { emitEvent: false });

    this.favoritesControl.setValue(null);
  }

  public openNewModal(): void {
    /* istanbul ignore next */
    this.modalRef = this.modalService.open(NewNoteModalComponent, {
      closeButton: false,
      data: { service: this.notesService, initialState: { projects: this.project ? [this.project] : [] } },
    });
    /* istanbul ignore next */
    this.modalRef.afterClosed$.pipe(untilDestroyed(this), take(1)).subscribe((callback: ModalCallback) => this.onModalClose(callback));
  }

  public onModalClose(callback?: ModalCallback): void {
    if (callback?.navigate) {
      this.router.navigate(callback.navigate);
    } else if (callback?.state === ModalState.Changed) {
      this.tableView.loadData();
    }
  }
}
