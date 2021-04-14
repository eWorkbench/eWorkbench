/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpParams } from '@angular/common/http';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { ModalState } from '@app/enums/modal-state.enum';
import { AuthService, DssContainersService, PageTitleService } from '@app/services';
import { CMSService } from '@app/stores/cms/services/cms.service';
import { UserService } from '@app/stores/user';
import { TableColumn, TableColumnChangedEvent, TableViewComponent } from '@eworkbench/table';
import { CMSJsonResponse, ModalCallback, User } from '@eworkbench/types';
import { DialogRef, DialogService } from '@ngneat/dialog';
import { FormBuilder } from '@ngneat/reactive-forms';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { keyBy, merge, values } from 'lodash-es';
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

  @ViewChild('tableView')
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

  public searchControl = this.fb.control<string | null>(null);

  public params = new HttpParams();

  public dssContainerListHowTo?: CMSJsonResponse;

  public modalRef?: DialogRef;

  public constructor(
    public readonly dssContainersService: DssContainersService,
    private readonly cmsService: CMSService,
    private readonly fb: FormBuilder,
    private readonly router: Router,
    private readonly modalService: DialogService,
    private readonly translocoService: TranslocoService,
    private readonly userService: UserService,
    private readonly pageTitleService: PageTitleService,
    private readonly cdr: ChangeDetectorRef,
    private readonly authService: AuthService
  ) {}

  public ngOnInit(): void {
    this.authService.user$.pipe(untilDestroyed(this)).subscribe(
      /* istanbul ignore next */ state => {
        this.currentUser = state.user;
      }
    );

    this.initTranslations();
    this.initDetails();
    this.initSearch();
  }

  public initTranslations(): void {
    this.translocoService
      .selectTranslate('dssContainers.title')
      .pipe(untilDestroyed(this))
      .subscribe(title => {
        this.title = title;
        this.pageTitleService.set(title);
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

        if (this.currentUser?.userprofile.ui_settings?.tables?.dsscontainers) {
          const merged = merge(
            keyBy(this.currentUser.userprofile.ui_settings.tables.dsscontainers, 'key'),
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
      });
  }

  public initDetails(): void {
    this.cmsService
      .getDssContainerListHowTo()
      .pipe(untilDestroyed(this))
      .subscribe(
        /* istanbul ignore next */ result => {
          this.dssContainerListHowTo = result;
          this.cdr.markForCheck();
        }
      );
  }

  public initSearch(): void {
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
    const settings = this.listColumns.map(col => ({ key: col.key, sort: col.sort, hidden: col.hidden }));

    this.authService.user$
      .pipe(
        untilDestroyed(this),
        take(1),
        switchMap(
          /* istanbul ignore next */ state => {
            const currentUser = state.user;
            return this.userService.changeSettings({
              userprofile: {
                ui_settings: {
                  ...currentUser?.userprofile.ui_settings,
                  tables: {
                    ...currentUser?.userprofile.ui_settings?.tables,
                    dsscontainers: settings,
                  },
                },
              },
            });
          }
        )
      )
      .subscribe();
  }

  public openNewModal(): void {
    /* istanbul ignore next */
    this.modalRef = this.modalService.open(NewDssContainerModalComponent, { closeButton: false });
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
