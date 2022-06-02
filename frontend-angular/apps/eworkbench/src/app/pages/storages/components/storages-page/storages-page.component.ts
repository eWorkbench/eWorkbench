/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpParams } from '@angular/common/http';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { ModalState } from '@app/enums/modal-state.enum';
import { ProjectSidebarItem } from '@app/enums/project-sidebar-item.enum';
import { LeaveProjectModalComponent } from '@app/pages/projects/components/modals/leave/leave.component';
import { AuthService, DrivesService, DssContainersService, PageTitleService } from '@app/services';
import { ProjectsService } from '@app/services/projects/projects.service';
import { UserService, UserStore } from '@app/stores/user';
import { TableColumn, TableViewComponent } from '@eworkbench/table';
import type { DssContainer, ModalCallback, Project, User } from '@eworkbench/types';
import { DialogRef, DialogService } from '@ngneat/dialog';
import { FormBuilder } from '@ngneat/reactive-forms';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Observable, of, Subject } from 'rxjs';
import { debounceTime, map, skip, switchMap, take } from 'rxjs/operators';
import { NewStorageModalComponent } from '../modals/new/new.component';

@UntilDestroy()
@Component({
  selector: 'eworkbench-storages-page',
  templateUrl: './storages-page.component.html',
  styleUrls: ['./storages-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StoragesPageComponent implements OnInit {
  public title = '';

  public currentUser: User | null = null;

  public sidebarItem = ProjectSidebarItem.Storages;

  @ViewChild('tableView', { static: true })
  public tableView!: TableViewComponent;

  @ViewChild('containerCellTemplate', { static: true })
  public containerCellTemplate!: TemplateRef<any>;

  public projectsControl = this.fb.control<string | null>(null);

  public usersControl = this.fb.control<number | null>(null);

  public searchControl = this.fb.control<string | null>(null);

  public dssContainersControl = this.fb.control<string | null>(null);

  public favoritesControl = this.fb.control<boolean | null>(null);

  public users: User[] = [];

  public dssContainers: DssContainer[] = [];

  public listColumns: TableColumn[] = [];

  public projects: Project[] = [];

  public favoriteProjects: Project[] = [];

  public projectsInput$ = new Subject<string>();

  public usersInput$ = new Subject<string>();

  public showSidebar = false;

  public project?: string;

  public params = new HttpParams();

  public loading = false;

  public modalRef?: DialogRef;

  public refresh = new EventEmitter<boolean>();

  public showUserFilter = false;

  public savedFilters = false;

  public constructor(
    public readonly drivesService: DrivesService,
    private readonly userService: UserService,
    private readonly dssContainersService: DssContainersService,
    private readonly router: Router,
    private readonly translocoService: TranslocoService,
    private readonly fb: FormBuilder,
    private readonly modalService: DialogService,
    private readonly projectsService: ProjectsService,
    private readonly cdr: ChangeDetectorRef,
    private readonly pageTitleService: PageTitleService,
    private readonly titleService: Title,
    private readonly route: ActivatedRoute,
    private readonly authService: AuthService,
    private readonly userStore: UserStore
  ) {}

  public get filtersChanged(): boolean {
    /* eslint-disable */
    return Boolean(
      this.projectsControl.value ||
        this.usersControl.value ||
        this.searchControl.value ||
        this.dssContainersControl.value ||
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

  public get getFilterSelectedDSSContainer(): DssContainer | undefined {
    return this.dssContainers.find(dssContainer => dssContainer.pk === this.dssContainersControl.value);
  }

  public ngOnInit(): void {
    this.authService.user$.pipe(untilDestroyed(this)).subscribe(state => {
      this.currentUser = state.user;
    });

    this.refresh.pipe(untilDestroyed(this)).subscribe(showTrashedItems => {
      this.onFilterItems(showTrashedItems);
    });

    this.initTranslations();
    this.initDetails();
    this.initSidebar();
    this.initSearch(this.showSidebar);
    this.initSearchInput();
    this.initPageTitle();
    void this.pageTitleService.set(this.title);
  }

  public initTranslations(): void {
    this.translocoService
      .selectTranslate('storages.title')
      .pipe(untilDestroyed(this))
      .subscribe(title => {
        this.title = title;
        void this.pageTitleService.set(title);
      });

    this.translocoService
      .selectTranslateObject('storages.columns')
      .pipe(untilDestroyed(this))
      .subscribe(column => {
        this.listColumns = [
          {
            cellTemplate: this.containerCellTemplate,
            name: column.title,
            key: 'title',
            hideable: false,
          },
        ];
      });

    if (this.currentUser?.userprofile.ui_settings?.filter_settings?.storages) {
      const filters = this.currentUser.userprofile.ui_settings?.filter_settings?.storages;

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

      if (filters.projects) {
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

      if (filters.dssContainers) {
        this.dssContainersControl.setValue(filters.dssContainers);
        this.params = this.params.set('container', filters.dssContainers);
      }

      if (filters.favorites) {
        this.favoritesControl.setValue(Boolean(filters.favorites));
        this.params = this.params.set('favourite', filters.favorites);
      }

      if (filters.active) {
        this.tableView.loadData(false, this.params);
      }
    }
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

  public initDetails(): void {
    if (this.loading) {
      return;
    }
    this.loading = true;

    this.dssContainersService
      .getList()
      .pipe(untilDestroyed(this))
      .subscribe(result => {
        this.dssContainers = result.data;
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

    this.dssContainersControl.value$.pipe(untilDestroyed(this), skip(1), debounceTime(500)).subscribe(value => {
      const queryParams = new URLSearchParams(window.location.search);

      if (value) {
        this.params = this.params.set('container', value);
        this.tableView.loadData(false, this.params);
        queryParams.set('dssContainers', value);
        history.pushState(null, '', `${window.location.pathname}?${queryParams.toString()}`);
      } else {
        this.params = this.params.delete('container');
        this.tableView.loadData(false, this.params);
        queryParams.delete('dssContainers');
        history.pushState(null, '', `${window.location.pathname}?${queryParams.toString()}`);
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
      const projects = queryParams.get('projects');
      const search = queryParams.get('search');
      const dssContainers = queryParams.get('dssContainers');
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

      if (dssContainers) {
        this.dssContainersControl.setValue(dssContainers);
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
                    storages: {
                      active: true,
                      users: this.usersControl.value,
                      projects: this.projectsControl.value,
                      search: this.searchControl.value,
                      dssContainers: this.dssContainersControl.value,
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
                    storages: {
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
    this.params = new HttpParams();
    history.pushState(null, '', window.location.pathname);

    this.projectsControl.setValue(null, { emitEvent: false });
    this.projects = [];

    this.usersControl.setValue(null, { emitEvent: false });
    this.users = [];

    this.searchControl.setValue(null, { emitEvent: false });

    this.dssContainersControl.setValue(null, { emitEvent: false });
    this.dssContainers = [];

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

  public openNewModal(): void {
    const initialState = this.project ? { projects: [this.project] } : null;

    this.modalRef = this.modalService.open(NewStorageModalComponent, {
      closeButton: false,
      data: { withSidebar: this.showSidebar, initialState: initialState },
    });

    this.modalRef.afterClosed$.pipe(untilDestroyed(this), take(1)).subscribe((callback: ModalCallback) => this.onModalClose(callback));
  }

  public onModalClose(callback?: ModalCallback): void {
    if (callback?.navigate) {
      void this.router.navigate(callback.navigate, { relativeTo: this.route });
    } else if (callback?.state === ModalState.Changed) {
      this.initDetails();
    }
  }
}
