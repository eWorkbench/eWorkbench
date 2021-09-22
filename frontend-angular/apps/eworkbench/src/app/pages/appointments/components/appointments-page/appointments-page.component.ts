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
import { NewAppointmentModalComponent } from '@app/modules/appointment/components/modals/new/new.component';
import { LeaveProjectModalComponent } from '@app/pages/projects/components/modals/leave/leave.component';
import { AppointmentsService, AuthService, PageTitleService, ProjectsService, ResourcesService } from '@app/services';
import { UserService, UserStore } from '@app/stores/user';
import { TableColumn, TableColumnChangedEvent, TableSortChangedEvent, TableViewComponent } from '@eworkbench/table';
import { ModalCallback, Project, Resource, User } from '@eworkbench/types';
import { DialogRef, DialogService } from '@ngneat/dialog';
import { FormBuilder } from '@ngneat/reactive-forms';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { keyBy, merge, values } from 'lodash';
import { Observable, of, Subject } from 'rxjs';
import { debounceTime, map, skip, switchMap, take } from 'rxjs/operators';

@UntilDestroy()
@Component({
  selector: 'eworkbench-appointments-page',
  templateUrl: './appointments-page.component.html',
  styleUrls: ['./appointments-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppointmentsPageComponent implements OnInit {
  public title = '';

  public currentUser: User | null = null;

  public defaultColumns: TableColumn[] = [];

  public listColumns: TableColumn[] = [];

  public sidebarItem = ProjectSidebarItem.Appointments;

  @ViewChild('tableView', { static: true })
  public tableView!: TableViewComponent;

  @ViewChild('titleCellTemplate', { static: true })
  public titleCellTemplate!: TemplateRef<any>;

  @ViewChild('startTimeCellTemplate', { static: true })
  public startTimeCellTemplate!: TemplateRef<any>;

  @ViewChild('endTimeCellTemplate', { static: true })
  public endTimeCellTemplate!: TemplateRef<any>;

  @ViewChild('attendeesCellTemplate', { static: true })
  public attendeesCellTemplate!: TemplateRef<any>;

  @ViewChild('createdAtCellTemplate', { static: true })
  public createdAtCellTemplate!: TemplateRef<any>;

  @ViewChild('createdByCellTemplate', { static: true })
  public createdByCellTemplate!: TemplateRef<any>;

  @ViewChild('lastModifiedAtCellTemplate', { static: true })
  public lastModifiedAtCellTemplate!: TemplateRef<any>;

  @ViewChild('lastModifiedByCellTemplate', { static: true })
  public lastModifiedByCellTemplate!: TemplateRef<any>;

  @ViewChild('resourceCellTemplate', { static: true })
  public resourceCellTemplate!: TemplateRef<any>;

  @ViewChild('actionsCellTemplate', { static: true })
  public actionsCellTemplate!: TemplateRef<any>;

  public modalRef?: DialogRef;

  public loading = false;

  public projectsControl = this.fb.control<string | null>(null);

  public usersControl = this.fb.control<number | null>(null);

  public searchControl = this.fb.control<string | null>(null);

  public resourceControl = this.fb.control<string | null>(null);

  public favoritesControl = this.fb.control<boolean | null>(null);

  public users: User[] = [];

  public params = new HttpParams();

  public usersInput$ = new Subject<string>();

  public projects: Project[] = [];

  public favoriteProjects: Project[] = [];

  public projectsInput$ = new Subject<string>();

  public resources: Resource[] = [];

  public favoriteResources: Resource[] = [];

  public resourceInput$ = new Subject<string>();

  public showSidebar = false;

  public project?: string;

  public sorting?: TableSortChangedEvent;

  public showUserFilter = false;

  public savedFilters = false;

  public constructor(
    public readonly appointmentsService: AppointmentsService,
    private readonly resourcesService: ResourcesService,
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
    private readonly authService: AuthService,
    private readonly userStore: UserStore
  ) {}

  public get filtersChanged(): boolean {
    /* eslint-disable */
    return Boolean(
      this.projectsControl.value ||
        this.usersControl.value ||
        this.searchControl.value ||
        this.resourceControl.value ||
        this.favoritesControl.value
    );
    /* eslint-enable */
  }

  public get getFilterSelectedUser(): User | undefined {
    return this.users.find(user => user.pk === this.usersControl.value);
  }

  public get getFilterSelectedProject(): Project | undefined {
    return this.projects.find(project => project.pk === this.projectsControl.value);
  }

  public get getFilterSelectedResource(): Resource | undefined {
    return this.resources.find(resource => resource.pk === this.resourceControl.value);
  }

  public ngOnInit(): void {
    this.authService.user$.pipe(untilDestroyed(this)).subscribe(
      /* istanbul ignore next */ state => {
        this.currentUser = state.user;
      }
    );

    this.initTranslations(this.showSidebar);
    this.initSidebar();
    this.initSearch(this.showSidebar);
    this.initSearchInput();
    this.initPageTitle();
    this.pageTitleService.set(this.title);
  }

  public initTranslations(project = false): void {
    this.translocoService
      .selectTranslate('appointments.title')
      .pipe(untilDestroyed(this))
      .subscribe(title => {
        this.title = title;
        this.pageTitleService.set(title);
      });

    this.translocoService
      .selectTranslateObject('appointments.columns')
      .pipe(untilDestroyed(this))
      .subscribe(column => {
        this.defaultColumns = [
          {
            cellTemplate: this.titleCellTemplate,
            name: column.title,
            key: 'title',
            sortable: true,
          },
          {
            name: column.location,
            key: 'location',
            sortable: true,
          },
          {
            cellTemplate: this.startTimeCellTemplate,
            name: column.startTime,
            key: 'date_time_start',
            sortable: true,
          },
          {
            cellTemplate: this.endTimeCellTemplate,
            name: column.endTime,
            key: 'date_time_end',
            sortable: true,
          },
          {
            cellTemplate: this.attendeesCellTemplate,
            name: column.attendees,
            key: 'attending_users',
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
            cellTemplate: this.lastModifiedAtCellTemplate,
            name: column.lastModifiedAt,
            key: 'last_modified_at',
            sortable: true,
            hidden: true,
          },
          {
            cellTemplate: this.lastModifiedByCellTemplate,
            name: column.lastModifiedBy,
            key: 'last_modified_by',
            sortable: true,
            hidden: true,
          },
          {
            cellTemplate: this.resourceCellTemplate,
            name: column.resource,
            key: 'resource__name',
            sortable: true,
            hidden: true,
          },
          {
            cellTemplate: this.actionsCellTemplate,
            name: '',
            key: 'actions',
            hideable: false,
          },
        ];

        if (this.currentUser?.userprofile.ui_settings?.tables?.appointments) {
          const merged = merge(
            keyBy(this.currentUser.userprofile.ui_settings.tables.appointments, 'key'),
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

        if (this.currentUser?.userprofile.ui_settings?.tables_sort?.appointments) {
          this.sorting = this.currentUser.userprofile.ui_settings.tables_sort.appointments;
        }

        if (this.currentUser?.userprofile.ui_settings?.filter_settings?.appointments) {
          const filters = this.currentUser.userprofile.ui_settings?.filter_settings?.appointments;

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
            this.params = this.params.set('attending_users', filters.users);
          }

          if (filters.projects && !project) {
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

          if (filters.resources) {
            this.resourcesService
              .get(filters.resources, this.currentUser.pk!)
              .pipe(
                untilDestroyed(this),
                map(/* istanbul ignore next */ resource => resource.data)
              )
              .subscribe(
                /* istanbul ignore next */ resource => {
                  this.resources = [...this.resources, resource];
                  this.cdr.markForCheck();
                }
              );
            this.resourceControl.setValue(filters.resources);
            this.params = this.params.set('resource', filters.resources);
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
        this.showSidebar = true;

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
          this.params = this.params.set('attending_users', value);
          this.tableView.loadData(false, this.params);
          queryParams.set('users', value.toString());
          history.pushState(null, '', `${window.location.pathname}?${queryParams.toString()}`);
        } else {
          this.params = this.params.delete('attending_users');
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

    this.resourceControl.value$.pipe(untilDestroyed(this), skip(1), debounceTime(500)).subscribe(
      /* istanbul ignore next */ value => {
        const queryParams = new URLSearchParams(window.location.search);

        if (value) {
          this.params = this.params.set('resource', value);
          this.tableView.loadData(false, this.params);
          queryParams.set('resources', value);
          history.pushState(null, '', `${window.location.pathname}?${queryParams.toString()}`);
        } else {
          this.params = this.params.delete('resource');
          this.tableView.loadData(false, this.params);
          queryParams.delete('resources');
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
        const resource = queryParams.get('resource');
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

        if (resource) {
          this.resourcesService
            .get(resource, this.currentUser!.pk!)
            .pipe(
              untilDestroyed(this),
              map(/* istanbul ignore next */ resource => resource.data)
            )
            .subscribe(
              /* istanbul ignore next */ resource => {
                this.resources = [...this.resources, resource];
                this.cdr.markForCheck();
              }
            );
          this.resourceControl.setValue(resource);
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

    this.resourceInput$
      .pipe(
        untilDestroyed(this),
        debounceTime(500),
        switchMap(/* istanbul ignore next */ input => (input ? this.resourcesService.search(input) : of([...this.favoriteResources])))
      )
      .subscribe(
        /* istanbul ignore next */ resources => {
          if (resources.length) {
            this.resources = [...resources].sort((a, b) => Number(b.is_favourite) - Number(a.is_favourite));
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

    this.resourcesService
      .getList(new HttpParams().set('favourite', 'true'))
      .pipe(untilDestroyed(this))
      .subscribe(
        /* istanbul ignore next */ resources => {
          if (resources.data.length) {
            this.favoriteResources = [...resources.data];
            this.resources = [...this.resources, ...this.favoriteResources]
              .filter((value, index, array) => array.map(resource => resource.pk).indexOf(value.pk) === index)
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
        switchMap(
          /* istanbul ignore next */ user => {
            const currentUser = user;
            return this.userService.changeSettings({
              userprofile: {
                ui_settings: {
                  ...currentUser.userprofile.ui_settings,
                  tables: {
                    ...currentUser.userprofile.ui_settings?.tables,
                    appointments: settings,
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
                    appointments: event,
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
                      appointments: {
                        active: true,
                        users: this.usersControl.value,
                        projects: this.projectsControl.value,
                        search: this.searchControl.value,
                        resources: this.resourceControl.value,
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
                      appointments: {
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

    this.resourceControl.setValue(null, { emitEvent: false });
    this.resources = [];

    this.favoritesControl.setValue(null);
  }

  public canDeactivate(): Observable<boolean> {
    if (this.showSidebar) {
      const userStoreValue = this.userStore.getValue();
      const userSetting = 'SkipDialog-LeaveProject';

      /* istanbul ignore next */
      const skipLeaveDialog = Boolean(userStoreValue.user?.userprofile.ui_settings?.confirm_dialog?.[userSetting]);

      if (skipLeaveDialog) {
        return of(true);
      }

      this.modalRef = this.modalService.open(LeaveProjectModalComponent, {
        closeButton: false,
      });
      /* istanbul ignore next */
      return this.modalRef.afterClosed$.pipe(
        untilDestroyed(this),
        take(1),
        map(val => Boolean(val))
      );
    }

    return of(true);
  }

  public openNewModal(): void {
    /* istanbul ignore next */
    this.modalRef = this.modalService.open(NewAppointmentModalComponent, {
      closeButton: false,
      data: { withSidebar: this.showSidebar, initialState: { projects: this.project ? [this.project] : [] } },
    });
    /* istanbul ignore next */
    this.modalRef.afterClosed$.pipe(untilDestroyed(this), take(1)).subscribe((callback: ModalCallback) => this.onModalClose(callback));
  }

  public onModalClose(callback?: ModalCallback): void {
    if (callback?.navigate) {
      this.router.navigate(callback.navigate, { relativeTo: this.route });
    } else if (callback?.state === ModalState.Changed) {
      this.tableView.loadData();
    }
  }
}
