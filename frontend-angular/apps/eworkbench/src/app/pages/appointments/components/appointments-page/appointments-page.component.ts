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
import { NewAppointmentModalComponent } from '@app/modules/appointment/components/modals/new/new.component';
import { RestoreModalComponent } from '@app/modules/trash/components/modals/restore/restore.component';
import { LeaveProjectModalComponent } from '@app/pages/projects/components/modals/leave/leave.component';
import { AppointmentsService, AuthService, PageTitleService, ProjectsService } from '@app/services';
import { UserService, UserStore } from '@app/stores/user';
import { TableColumn, TableColumnChangedEvent, TableSortChangedEvent, TableViewComponent } from '@eworkbench/table';
import { ModalCallback, Project, User } from '@eworkbench/types';
import { DialogRef, DialogService } from '@ngneat/dialog';
import { FormBuilder } from '@ngneat/reactive-forms';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { keyBy, merge, values } from 'lodash-es';
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

  @ViewChild('tableView')
  public tableView!: TableViewComponent;

  @ViewChild('titleCellTemplate', { static: true })
  public titleCellTemplate!: TemplateRef<any>;

  @ViewChild('startTimeCellTemplate', { static: true })
  public startTimeCellTemplate!: TemplateRef<any>;

  @ViewChild('endTimeCellTemplate', { static: true })
  public endTimeCellTemplate!: TemplateRef<any>;

  @ViewChild('attendingUsersCellTemplate', { static: true })
  public attendingUsersCellTemplate!: TemplateRef<any>;

  @ViewChild('createdAtCellTemplate', { static: true })
  public createdAtCellTemplate!: TemplateRef<any>;

  @ViewChild('createdByCellTemplate', { static: true })
  public createdByCellTemplate!: TemplateRef<any>;

  @ViewChild('lastModifiedAtCellTemplate', { static: true })
  public lastModifiedAtCellTemplate!: TemplateRef<any>;

  @ViewChild('lastModifiedByCellTemplate', { static: true })
  public lastModifiedByCellTemplate!: TemplateRef<any>;

  @ViewChild('actionsCellTemplate', { static: true })
  public actionsCellTemplate!: TemplateRef<any>;

  public modalRef?: DialogRef;

  public loading = false;

  public projectsControl = this.fb.control<string | null>(null);

  public usersControl = this.fb.control<string | null>(null);

  public searchControl = this.fb.control<string | null>(null);

  public users: User[] = [];

  public params = new HttpParams();

  public usersInput$ = new Subject<string>();

  public projects: Project[] = [];

  public projectsInput$ = new Subject<string>();

  public showSidebar = false;

  public project?: string;

  public sorting?: TableSortChangedEvent;

  public restoreEmitter = new EventEmitter<ModalCallback>();

  public constructor(
    public readonly appointmentsService: AppointmentsService,
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

  public ngOnInit(): void {
    this.authService.user$.pipe(untilDestroyed(this)).subscribe(
      /* istanbul ignore next */ state => {
        this.currentUser = state.user;
      }
    );

    this.initTranslations();
    this.initSidebar();
    this.initSearch(this.showSidebar);
    this.initSearchInput();
    this.initPageTitle();
    this.pageTitleService.set(this.title);
  }

  public initTranslations(): void {
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
            cellTemplate: this.attendingUsersCellTemplate,
            name: column.attendingUsers,
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
      });
  }

  public initSidebar(): void {
    this.route.params.subscribe(params => {
      if (params.projectId) {
        this.showSidebar = true;

        this.projectsService.get(params.projectId).subscribe(
          /* istanbul ignore next */ project => {
            this.projects = [...this.projects, project];
            this.projectsControl.setValue(params.projectId);
            this.project = params.projectId;
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
          return;
        }

        this.params = this.params.delete('projects_recursive');
        this.tableView.loadData(false, this.params);
        if (!project) {
          queryParams.delete('projects');
          history.pushState(null, '', `${window.location.pathname}?${queryParams.toString()}`);
        }
      }
    );

    this.usersControl.value$.pipe(untilDestroyed(this), skip(1), debounceTime(500)).subscribe(
      /* istanbul ignore next */ value => {
        if (value) {
          this.params = this.params.set('attending_users', value);
          this.tableView.loadData(false, this.params);
          // TODO: Needs endpoint to fetch a user by its id
          /* this.router.navigate(['.'], { relativeTo: this.route, queryParams: { users: value }, queryParamsHandling: 'merge' }); */
          return;
        }

        this.params = this.params.delete('attending_users');
        this.tableView.loadData(false, this.params);
        // TODO: Needs endpoint to fetch a user by its id
        /* this.router.navigate(['.'], { relativeTo: this.route, queryParams: { users: null }, queryParamsHandling: 'merge' }); */
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
          return;
        }

        this.params = this.params.delete('search');
        this.tableView.loadData(false, this.params);
        queryParams.delete('search');
        history.pushState(null, '', `${window.location.pathname}?${queryParams.toString()}`);
      }
    );

    this.route.queryParamMap.pipe(untilDestroyed(this), take(1)).subscribe(
      /* istanbul ignore next */ queryParams => {
        const projects = queryParams.get('projects');
        const search = queryParams.get('search');

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
        switchMap(/* istanbul ignore next */ input => (input ? this.projectsService.search(input) : of([])))
      )
      .subscribe(
        /* istanbul ignore next */ projects => {
          if (projects.length) {
            this.projects = [...projects];
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

    this.listColumns = values(merged);
    const settings = this.listColumns.map(col => ({ key: col.key, sort: col.sort, hidden: col.hidden, hideable: col.hideable }));

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
      data: { initialState: { projects: this.project ? [this.project] : [] } },
    });
    /* istanbul ignore next */
    this.modalRef.afterClosed$.pipe(untilDestroyed(this), take(1)).subscribe((callback: ModalCallback) => this.onModalClose(callback));
  }

  public openTrashModal(): void {
    /* istanbul ignore next */
    const subscription = this.restoreEmitter.pipe(untilDestroyed(this)).subscribe((callback: ModalCallback) => this.onModalClose(callback));
    /* istanbul ignore next */
    this.modalRef = this.modalService.open(RestoreModalComponent, {
      closeButton: false,
      data: { service: this.appointmentsService, routerBaseLink: '/appointments', restoreEmitter: this.restoreEmitter },
    });
    /* istanbul ignore next */
    this.modalRef.afterClosed$.pipe(untilDestroyed(this), take(1)).subscribe(() => subscription.unsubscribe());
  }

  public onModalClose(callback?: ModalCallback): void {
    if (callback?.navigate) {
      this.router.navigate(callback.navigate);
    } else if (callback?.state === ModalState.Changed) {
      this.tableView.loadData();
    }
  }
}