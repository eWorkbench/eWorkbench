/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpParams } from '@angular/common/http';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { ModalState } from '@app/enums/modal-state.enum';
import { SitePreferencesService } from '@app/services';
import { AuthService } from '@app/services/auth/auth.service';
import { TableColumn, TableViewComponent } from '@eworkbench/table';
import type {
  ContentTypeModels,
  DropdownElement,
  ModalCallback,
  Relation,
  RelationPutPayload,
  SitePreferences,
  User,
} from '@eworkbench/types';
import { DialogRef, DialogService } from '@ngneat/dialog';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
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

  @ViewChild('titleCellTemplate', { static: true })
  public titleCellTemplate!: TemplateRef<any>;

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
  public refresh?: EventEmitter<boolean>;

  public params = new HttpParams().set('ordering', '-created_at');

  public initialLoading = true;

  public loading = false;

  public selectedType?: string | number | undefined;

  public defaultColumns: TableColumn[] = [];

  public listColumns: TableColumn[] = [];

  public currentUser: User | null = null;

  public modalRef?: DialogRef;

  public dropdownContentTypes: DropdownElement[] = [];

  public contentTypes: Record<ContentTypeModels | string, number> = {};

  public constructor(
    private readonly translocoService: TranslocoService,
    private readonly cdr: ChangeDetectorRef,
    private readonly toastrService: ToastrService,
    private readonly modalService: DialogService,
    private readonly authService: AuthService,
    private readonly sitePreferencesService: SitePreferencesService
  ) {}

  public ngOnInit(): void {
    this.refresh?.pipe(untilDestroyed(this)).subscribe(() => {
      this.tableView.loadData();
    });

    this.authService.user$.pipe(untilDestroyed(this)).subscribe(state => {
      this.currentUser = state.user;
    });

    this.initTranslations();
    this.initSitePreferences();
  }

  public initTranslations(): void {
    this.translocoService
      .selectTranslateObject('relations.columns')
      .pipe(untilDestroyed(this))
      .subscribe(column => {
        this.defaultColumns = [
          {
            cellTemplate: this.titleCellTemplate,
            name: column.title,
            key: 'left_content_object',
          },
          {
            cellTemplate: this.linkedByCellTemplate,
            name: column.setBy,
            key: 'created_by',
            sortable: true,
          },
          {
            cellTemplate: this.linkedAtCellTemplate,
            name: column.setAt,
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
        this.dropdownContentTypes = [
          {
            value: 'shared_elements.meeting',
            label: contentType.appointment,
          },
          {
            value: 'shared_elements.note',
            label: contentType.note,
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

  public initSitePreferences(): void {
    this.sitePreferencesService
      .get()
      .pipe(untilDestroyed(this))
      .subscribe((preferences: SitePreferences) => {
        this.params = this.params.set('without_content_type', preferences.content_types['shared_elements.comment']);
        this.contentTypes = preferences.content_types;
        this.initialLoading = false;
        this.cdr.markForCheck();
      });
  }

  public onChangeFilterContentType(element?: DropdownElement): void {
    this.selectedType = element?.value;
    if (this.selectedType) {
      this.params = this.params.set('with_content_type', this.contentTypes[this.selectedType]);
    } else {
      this.params = this.params.delete('with_content_type');
    }
    this.tableView.updateParams(this.params);
    this.tableView.loadData();
    this.cdr.markForCheck();
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
      .subscribe((result: Relation) => {
        const toastMsg = result.private
          ? this.translocoService.translate('linkList.private.toastr.success')
          : this.translocoService.translate('linkList.public.toastr.success');

        this.loading = false;
        this.cdr.markForCheck();
        this.toastrService.success(toastMsg);
      });
  }

  public onOpenDeleteModal(relation: Relation): void {
    this.modalRef = this.modalService.open(DeleteLinkComponent, {
      closeButton: false,
      data: { service: this.service, baseModelId: this.id, relationId: relation.pk },
    });

    this.modalRef.afterClosed$.pipe(untilDestroyed(this), take(1)).subscribe((callback: ModalCallback) => this.onModalClose(callback));
  }

  public onModalClose(callback?: ModalCallback): void {
    if (callback?.state === ModalState.Changed) {
      this.tableView.loadData();
    }
  }
}
