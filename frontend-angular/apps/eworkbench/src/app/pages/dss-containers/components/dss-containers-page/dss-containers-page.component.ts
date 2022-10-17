/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpParams } from '@angular/common/http';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { ModalState } from '@app/enums/modal-state.enum';
import { AuthService, DssContainersService, PageTitleService } from '@app/services';
import { CMSService } from '@app/stores/cms/services/cms.service';
import { UserService } from '@app/stores/user';
import { TableColumn, TableColumnChangedEvent, TableSortChangedEvent, TableViewComponent } from '@eworkbench/table';
import type { CMSJsonResponse, ModalCallback, User } from '@eworkbench/types';
import { DialogRef, DialogService } from '@ngneat/dialog';
import { FormBuilder } from '@ngneat/reactive-forms';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { keyBy, merge, values } from 'lodash';
import { of, Subject } from 'rxjs';
import { debounceTime, skip, switchMap, take } from 'rxjs/operators';
import { NewDssContainerModalComponent } from '../modals/new/new.component';

@UntilDestroy()
@Component({
  selector: 'eworkbench-dss-containers-page',
  templateUrl: './dss-containers-page.component.html',
  styleUrls: ['./dss-containers-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DssContainersPageComponent implements OnInit {
  public title = '';

  public currentUser: User | null = null;

  public defaultColumns: TableColumn[] = [];

  public listColumns: TableColumn[] = [];

  @ViewChild('tableView', { static: true })
  public tableView!: TableViewComponent;

  @ViewChild('nameCellTemplate', { static: true })
  public nameCellTemplate!: TemplateRef<any>;

  @ViewChild('pathCellTemplate', { static: true })
  public pathCellTemplate!: TemplateRef<any>;

  @ViewChild('readWriteSettingCellTemplate', { static: true })
  public readWriteSettingCellTemplate!: TemplateRef<any>;

  @ViewChild('importOptionCellTemplate', { static: true })
  public importOptionCellTemplate!: TemplateRef<any>;

  @ViewChild('createdAtCellTemplate', { static: true })
  public createdAtCellTemplate!: TemplateRef<any>;

  @ViewChild('createdByCellTemplate', { static: true })
  public createdByCellTemplate!: TemplateRef<any>;

  @ViewChild('lastModifiedAtCellTemplate', { static: true })
  public lastModifiedAtCellTemplate!: TemplateRef<any>;

  @ViewChild('lastModifiedByCellTemplate', { static: true })
  public lastModifiedByCellTemplate!: TemplateRef<any>;

  public modalRef?: DialogRef;

  public loading = false;

  public usersControl = this.fb.control<number | null>(null);

  public searchControl = this.fb.control<string | null>(null);

  public users: User[] = [];

  public params = new HttpParams();

  public usersInput$ = new Subject<string>();

  public showSidebar = false;

  public dssContainerListHowTo?: CMSJsonResponse;

  public sorting?: TableSortChangedEvent;

  public showUserFilter = false;

  public savedFilters = false;

  public constructor(
    public readonly dssContainersService: DssContainersService,
    private readonly cmsService: CMSService,
    private readonly fb: FormBuilder,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly modalService: DialogService,
    private readonly translocoService: TranslocoService,
    private readonly userService: UserService,
    private readonly pageTitleService: PageTitleService,
    private readonly titleService: Title,
    private readonly cdr: ChangeDetectorRef,
    private readonly authService: AuthService
  ) {}

  public get filtersChanged(): boolean {
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    return Boolean(this.usersControl.value || this.searchControl.value);
  }

  public get getFilterSelectedUser(): User | undefined {
    return this.users.find(user => user.pk === this.usersControl.value);
  }

  public ngOnInit(): void {
    this.authService.user$.pipe(untilDestroyed(this)).subscribe(state => {
      this.currentUser = state.user;
    });

    this.initTranslations();
    this.initDetails();
    this.initSearch();
    this.initSearchInput();
    this.initPageTitle();
    void this.pageTitleService.set(this.title);
  }

  public initTranslations(): void {
    this.translocoService
      .selectTranslate('dssContainers.title')
      .pipe(untilDestroyed(this))
      .subscribe(title => {
        this.title = title;
        void this.pageTitleService.set(title);
      });

    this.translocoService
      .selectTranslateObject('dssContainers.columns')
      .pipe(untilDestroyed(this))
      .subscribe(column => {
        this.defaultColumns = [
          {
            cellTemplate: this.nameCellTemplate,
            name: column.name,
            key: 'name',
            sortable: true,
            width: '20%',
          },
          {
            cellTemplate: this.pathCellTemplate,
            name: column.path,
            key: 'path',
            sortable: true,
          },
          {
            cellTemplate: this.readWriteSettingCellTemplate,
            name: column.readWriteSetting,
            key: 'read_write_setting',
          },
          {
            cellTemplate: this.importOptionCellTemplate,
            name: column.importOption,
            key: 'import_option',
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
        ];

        if (this.currentUser?.userprofile.ui_settings?.tables?.dssContainers) {
          const merged = merge(
            keyBy(this.currentUser.userprofile.ui_settings.tables.dssContainers, 'key'),
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

        if (this.currentUser?.userprofile.ui_settings?.tables_sort?.dssContainers) {
          this.sorting = this.currentUser.userprofile.ui_settings.tables_sort.dssContainers;
        }

        if (this.currentUser?.userprofile.ui_settings?.filter_settings?.dssContainers) {
          const filters = this.currentUser.userprofile.ui_settings?.filter_settings?.dssContainers;

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

          if (filters.search) {
            this.searchControl.setValue(filters.search);
            this.params = this.params.set('search', filters.search);
          }

          if (filters.active) {
            this.tableView.loadData(false, this.params);
          }
        }
      });
  }

  public initDetails(): void {
    this.cmsService
      .getDssContainerListHowTo()
      .pipe(untilDestroyed(this))
      .subscribe(result => {
        this.dssContainerListHowTo = result;
        this.cdr.markForCheck();
      });
  }

  public initSearch(): void {
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

    this.route.queryParamMap.pipe(untilDestroyed(this), take(1)).subscribe(queryParams => {
      const users = queryParams.get('users');
      const search = queryParams.get('search');

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
                  dssContainers: settings,
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
                  dssContainers: event,
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
                    dssContainers: {
                      active: true,
                      users: this.usersControl.value,
                      search: this.searchControl.value,
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
                    dssContainers: {
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

    this.usersControl.setValue(null, { emitEvent: false });
    this.users = [];

    // Unlike in other list views we must emit an event here or else the reset won't get recognized.
    // In other list views this is amitted by the favorite checkbox which doesn't exist in this list view.
    this.searchControl.setValue(null);
  }

  public openNewModal(): void {
    this.modalRef = this.modalService.open(NewDssContainerModalComponent, { closeButton: false });

    this.modalRef.afterClosed$.pipe(untilDestroyed(this), take(1)).subscribe((callback: ModalCallback) => this.onModalClose(callback));
  }

  public onModalClose(callback?: ModalCallback): void {
    if (callback?.navigate) {
      void this.router.navigate(callback.navigate);
    } else if (callback?.state === ModalState.Changed) {
      this.tableView.loadData();
    }
  }
}
