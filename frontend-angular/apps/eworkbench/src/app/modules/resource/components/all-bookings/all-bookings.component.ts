/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpParams } from '@angular/common/http';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ModalState } from '@app/enums/modal-state.enum';
import { NewAppointmentModalComponent } from '@app/modules/appointment/components/modals/new/new.component';
import { AllResourceBookingsService, AuthService } from '@app/services';
import { UserService } from '@app/stores/user';
import { TableColumn, TableColumnChangedEvent, TableSortChangedEvent, TableViewComponent } from '@eworkbench/table';
import { Appointment, ExportLink, ModalCallback, ResourceBooking, User } from '@eworkbench/types';
import { DialogRef, DialogService } from '@ngneat/dialog';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { keyBy, merge, values } from 'lodash-es';
import { switchMap, take } from 'rxjs/operators';

@UntilDestroy()
@Component({
  selector: 'eworkbench-all-resource-bookings',
  templateUrl: './all-bookings.component.html',
  styleUrls: ['./all-bookings.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AllResourceBookingsComponent implements OnInit {
  public currentUser: User | null = null;

  public defaultColumns: TableColumn[] = [];

  public listColumns: TableColumn[] = [];

  @ViewChild('tableView')
  public tableView!: TableViewComponent;

  @ViewChild('nameCellTemplate', { static: true })
  public nameCellTemplate!: TemplateRef<any>;

  @ViewChild('typeCellTemplate', { static: true })
  public typeCellTemplate!: TemplateRef<any>;

  @ViewChild('descriptionCellTemplate', { static: true })
  public descriptionCellTemplate!: TemplateRef<any>;

  @ViewChild('appointmentCellTemplate', { static: true })
  public appointmentCellTemplate!: TemplateRef<any>;

  @ViewChild('appointmentDescriptionCellTemplate', { static: true })
  public appointmentDescriptionCellTemplate!: TemplateRef<any>;

  @ViewChild('attendingUsersCellTemplate', { static: true })
  public attendingUsersCellTemplate!: TemplateRef<any>;

  @ViewChild('dateTimeStartCellTemplate', { static: true })
  public dateTimeStartCellTemplate!: TemplateRef<any>;

  @ViewChild('dateTimeEndCellTemplate', { static: true })
  public dateTimeEndCellTemplate!: TemplateRef<any>;

  @ViewChild('createdAtCellTemplate', { static: true })
  public createdAtCellTemplate!: TemplateRef<any>;

  @ViewChild('createdByCellTemplate', { static: true })
  public createdByCellTemplate!: TemplateRef<any>;

  @ViewChild('actionsCellTemplate', { static: true })
  public actionsCellTemplate!: TemplateRef<any>;

  @Input()
  public resourceId?: string;

  @Input()
  public refresh?: EventEmitter<boolean>;

  public modalRef?: DialogRef;

  public loading = true;

  public hidePastBookings = new FormControl(false);

  public serviceParams = new HttpParams();

  public sorting?: TableSortChangedEvent;

  public readonly dateFormat = "yyyy-MM-dd HH':'mm";

  public constructor(
    public readonly allResourceBookingsService: AllResourceBookingsService,
    private readonly modalService: DialogService,
    private readonly translocoService: TranslocoService,
    private readonly cdr: ChangeDetectorRef,
    private readonly userService: UserService,
    private readonly authService: AuthService
  ) {}

  public ngOnInit(): void {
    this.authService.user$.pipe(untilDestroyed(this)).subscribe(
      /* istanbul ignore next */ state => {
        this.currentUser = state.user;
      }
    );

    /* istanbul ignore next */
    this.refresh?.pipe(untilDestroyed(this)).subscribe(() => {
      this.tableView.loadData();
    });

    if (this.resourceId) {
      this.serviceParams = this.serviceParams.set('resource', this.resourceId);
    }

    this.initTranslations();
    this.patchFormValues();
  }

  public initTranslations(): void {
    this.translocoService
      .selectTranslateObject('resources.allBookings.columns')
      .pipe(untilDestroyed(this))
      .subscribe(column => {
        this.defaultColumns = [
          {
            cellTemplate: this.nameCellTemplate,
            name: column.name,
            key: 'resource__name',
            sortable: true,
          },
          {
            cellTemplate: this.typeCellTemplate,
            name: column.type,
            key: 'resource__type',
            sortable: true,
          },
          {
            name: column.location,
            key: 'resource__location',
            sortable: true,
            hidden: true,
          },
          {
            cellTemplate: this.descriptionCellTemplate,
            name: column.description,
            key: 'resource__description',
            sortable: true,
            hidden: true,
          },
          {
            cellTemplate: this.appointmentCellTemplate,
            name: column.appointment,
            key: 'title',
            sortable: true,
          },
          {
            cellTemplate: this.appointmentDescriptionCellTemplate,
            name: column.appointmentDescription,
            key: 'description',
            sortable: true,
            hidden: true,
          },
          {
            cellTemplate: this.attendingUsersCellTemplate,
            name: column.attendingUsers,
            key: 'attending_users',
          },
          {
            cellTemplate: this.dateTimeStartCellTemplate,
            name: column.dateTimeStart,
            key: 'date_time_start',
            sortable: true,
          },
          {
            cellTemplate: this.dateTimeEndCellTemplate,
            name: column.dateTimeEnd,
            key: 'date_time_end',
            sortable: true,
          },
          {
            cellTemplate: this.createdAtCellTemplate,
            name: column.createdAt,
            key: 'created_at',
            sortable: true,
            hidden: true,
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

        if (this.currentUser?.userprofile.ui_settings?.tables?.all_resourcebookings) {
          const merged = merge(
            keyBy(this.currentUser.userprofile.ui_settings.tables.all_resourcebookings, 'key'),
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

        if (this.currentUser?.userprofile.ui_settings?.tables_sort?.all_resourcebookings) {
          this.sorting = this.currentUser.userprofile.ui_settings.tables_sort.all_resourcebookings;
        }
      });
  }

  public patchFormValues(): void {
    this.hidePastBookings.disable();
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
                    resourcebookings: settings,
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
                    resourcebookings: event,
                  },
                },
              },
            });
          }
        )
      )
      .subscribe();
  }

  public onExport(id: string): void {
    if (this.loading) {
      return;
    }
    this.loading = true;

    this.allResourceBookingsService
      .export(id)
      .pipe(untilDestroyed(this))
      .subscribe(
        /* istanbul ignore next */ (exportLink: ExportLink) => {
          window.open(exportLink.url, '_blank');
          this.loading = false;
          this.cdr.markForCheck();
        },
        /* istanbul ignore next */ () => {
          this.loading = false;
          this.cdr.markForCheck();
        }
      );
  }

  public onExportMany(): void {
    if (this.loading) {
      return;
    }
    this.loading = true;

    const idList: string[] = [];
    this.tableView.data.map(
      /* istanbul ignore next */ (row: ResourceBooking) => {
        idList.push(row.pk);
      }
    );

    this.allResourceBookingsService
      .exportMany(idList)
      .pipe(untilDestroyed(this))
      .subscribe(
        /* istanbul ignore next */ (data: Blob) => {
          const blob = new Blob([data], { type: 'application/pdf' });
          const url = window.URL.createObjectURL(blob);

          const downloadLink = document.createElement('a');
          downloadLink.href = url;
          downloadLink.download = 'Export.pdf';
          downloadLink.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));

          // Fix for FireFox
          setTimeout(() => {
            window.URL.revokeObjectURL(url);
            downloadLink.remove();
          }, 100);

          this.loading = false;
          this.cdr.markForCheck();
        },
        /* istanbul ignore next */ () => {
          this.loading = false;
          this.cdr.markForCheck();
        }
      );
  }

  public onOpenResourceBookingModal(appointment: Appointment): void {
    /* istanbul ignore next */
    this.modalRef = this.modalService.open(NewAppointmentModalComponent, {
      closeButton: false,
      data: {
        initialState: {
          ...appointment,
          date_time_start: null,
          date_time_end: null,
        },
      },
    });

    /* istanbul ignore next */
    this.modalRef.afterClosed$
      .pipe(untilDestroyed(this), take(1))
      .subscribe((callback: { state: ModalState; event: any }) => this.onResourceBookingModalClose(callback));
  }

  public onResourceBookingModalClose(callback?: ModalCallback): void {
    if (callback?.state === ModalState.Changed) {
      this.tableView.loadData();
      this.cdr.markForCheck();
    }
  }

  public onToogleHidePastBookings(): void {
    if (this.loading) {
      return;
    }
    this.loading = true;

    if (this.hidePastBookings.value) {
      this.tableView.updateParams(this.serviceParams.set('end_date__gte', new Date().toISOString()));
    } else {
      this.tableView.updateParams(this.serviceParams);
    }

    this.hidePastBookings.disable();
    this.tableView.loadData();
  }

  public onRenderFinish(): void {
    this.loading = false;
    this.hidePastBookings.enable();
  }
}
