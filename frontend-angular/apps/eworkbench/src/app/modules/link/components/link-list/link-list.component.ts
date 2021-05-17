/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpParams } from '@angular/common/http';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { ModalState } from '@app/enums/modal-state.enum';
import { AuthService } from '@app/services/auth/auth.service';
import { TableSortChangedEvent, TableSortDirection, TableColumn, TableViewComponent, TableColumnChangedEvent } from '@eworkbench/table';
import { DropdownElement, ModalCallback, Relation, RelationPutPayload, User } from '@eworkbench/types';
import { DialogRef, DialogService } from '@ngneat/dialog';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { keyBy, merge, values } from 'lodash-es';
import { ToastrService } from 'ngx-toastr';
import { take } from 'rxjs/operators';
import { DeleteLinkComponent } from '../modals/delete-link/delete-link.component';

@UntilDestroy()
@Component({
  selector: 'eworkbench-link-list',
  templateUrl: './link-list.component.html',
  styleUrls: ['./link-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LinkListComponent implements OnInit {
  @ViewChild('tableView')
  public tableView!: TableViewComponent;

  @ViewChild('relationNameCellTemplate', { static: true })
  public relationNameCellTemplate!: TemplateRef<any>;

  @ViewChild('typeCellTemplate', { static: true })
  public typeCellTemplate!: TemplateRef<any>;

  @ViewChild('linkedByCellTemplate', { static: true })
  public linkedByCellTemplate!: TemplateRef<any>;

  @ViewChild('linkedAtCellTemplate', { static: true })
  public linkedAtCellTemplate!: TemplateRef<any>;

  @ViewChild('actionsCellTemplate', { static: true })
  public actionsCellTemplate!: TemplateRef<any>;

  @Input()
  public id!: string;

  @Input()
  public service!: any;

  @Input()
  public refresh?: EventEmitter<string>;

  public loading = false;

  public relations?: Relation[];

  public allRelations?: Relation[];

  public selectedType?: string;

  public defaultColumns: TableColumn[] = [];

  public listColumns: TableColumn[] = [];

  public currentUser: User | null = null;

  public modalRef?: DialogRef;

  private sortBy = 'created_at';

  private sort = TableSortDirection.Descending;

  public contentTypes: DropdownElement[] = [];

  public constructor(
    private readonly translocoService: TranslocoService,
    private readonly cdr: ChangeDetectorRef,
    private readonly toastrService: ToastrService,
    private readonly modalService: DialogService,
    private readonly authService: AuthService
  ) {}

  private get orderByDirection(): string | null {
    switch (this.sort) {
      case TableSortDirection.None: {
        return null;
      }

      case TableSortDirection.Ascending: {
        return '';
      }

      case TableSortDirection.Descending: {
        return '-';
      }
    }
  }

  public ngOnInit(): void {
    /* istanbul ignore next */
    this.refresh?.pipe(untilDestroyed(this)).subscribe(() => {
      this.initDetails();
    });

    this.authService.user$.pipe(untilDestroyed(this)).subscribe(state => {
      this.currentUser = state.user;
    });

    this.initTranslations();
    this.initDetails();
  }

  public initTranslations(): void {
    this.translocoService
      .selectTranslateObject('relations.columns')
      .pipe(untilDestroyed(this))
      .subscribe(column => {
        this.defaultColumns = [
          {
            cellTemplate: this.relationNameCellTemplate,
            name: column.relationName,
            key: 'left_content_object',
          },
          {
            cellTemplate: this.typeCellTemplate,
            name: column.type,
            key: 'type',
          },
          {
            cellTemplate: this.linkedByCellTemplate,
            name: column.createdBy,
            key: 'created_by',
            sortable: true,
          },
          {
            cellTemplate: this.linkedAtCellTemplate,
            name: column.linkedAt,
            key: 'created_at',
            sortable: true,
          },
          {
            cellTemplate: this.actionsCellTemplate,
            name: '',
            key: 'actions',
            hideable: false,
          },
        ];

        this.listColumns = [...this.defaultColumns];
      });

    this.translocoService
      .selectTranslateObject('linkList.contentType')
      .pipe(untilDestroyed(this))
      .subscribe(contentType => {
        this.contentTypes = [
          {
            value: 'shared_elements.meeting',
            label: contentType.appointment,
          },
          {
            value: 'shared_elements.note',
            label: contentType.comment,
          },
          {
            value: 'shared_elements.contact',
            label: contentType.contact,
          },
          {
            value: 'dmp.dmp',
            label: contentType.dmp,
          },
          {
            value: 'shared_elements.file',
            label: contentType.file,
          },
          {
            value: 'labbooks.labbook',
            label: contentType.labBook,
          },
          {
            value: 'pictures.picture',
            label: contentType.picture,
          },
          {
            value: 'plugins.plugin',
            label: contentType.pluginContent,
          },
          {
            value: 'projects.project',
            label: contentType.project,
          },
          {
            value: 'drives.drive',
            label: contentType.storage,
          },
          {
            value: 'shared_elements.task',
            label: contentType.task,
          },
          {
            value: 'kanban_boards.kanbanboard',
            label: contentType.taskBoard,
          },
        ];
      });
  }

  public initDetails(): void {
    if (this.loading) {
      return;
    }
    this.loading = true;

    let params = new HttpParams();
    if (this.orderByDirection !== null) {
      params = params.set('ordering', `${this.orderByDirection}${this.sortBy}`);
    }

    this.service
      .getRelations(this.id, params)
      .pipe(untilDestroyed(this))
      .subscribe(
        /* istanbul ignore next */ (relations: Relation[]) => {
          this.loading = false;
          if (relations.length) {
            this.allRelations = [...relations];
            this.filterRelations();
          } else {
            this.relations = [];
          }
          this.cdr.markForCheck();
        }
      );

    this.cdr.markForCheck();
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
  }

  public filterRelations(): void {
    if (this.allRelations?.length) {
      if (this.selectedType) {
        const result: Relation[] = this.allRelations.filter(relation => relation.left_content_type_model === this.selectedType);
        this.relations = [...result];
      } else {
        this.relations = [...this.allRelations];
      }
      this.cdr.markForCheck();
    }
  }

  public onSortChanged(event: TableSortChangedEvent): void {
    this.sortBy = event.key;
    this.sort = event.direction;
    this.initDetails();
  }

  public onChangeFilterContentType(element?: DropdownElement): void {
    this.selectedType = element?.value;
    this.filterRelations();
  }

  public onChangePrivateState(relation: RelationPutPayload): void {
    if (this.loading) {
      return;
    }
    this.loading = true;

    relation.private = !relation.private;

    this.service
      .putRelation(this.id, relation.pk, relation)
      .pipe(untilDestroyed(this))
      .subscribe(
        /* istanbul ignore next */
        (result: Relation) => {
          const toastMsg = result.private
            ? this.translocoService.translate('linkList.private.toastr.success')
            : this.translocoService.translate('linkList.public.toastr.success');

          this.loading = false;
          this.cdr.markForCheck();
          this.toastrService.success(toastMsg);
        }
      );
  }

  public onOpenDeleteModal(relation: Relation): void {
    this.modalRef = this.modalService.open(DeleteLinkComponent, {
      closeButton: false,
      data: { service: this.service, baseModelId: this.id, relationId: relation.pk },
    });
    /* istanbul ignore next */
    this.modalRef.afterClosed$.pipe(untilDestroyed(this), take(1)).subscribe((callback: ModalCallback) => this.onModalClose(callback));
  }

  public onModalClose(callback?: ModalCallback): void {
    if (callback?.state === ModalState.Changed) {
      this.initDetails();
    }
  }
}
