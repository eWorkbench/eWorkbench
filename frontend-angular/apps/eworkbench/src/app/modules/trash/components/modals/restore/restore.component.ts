/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpParams } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { ModalState } from '@app/enums/modal-state.enum';
import { TableColumn, TableViewComponent } from '@eworkbench/table';
import { DialogRef } from '@ngneat/dialog';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: 'eworkbench-restore-modal',
  templateUrl: './restore.component.html',
  styleUrls: ['./restore.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RestoreModalComponent implements OnInit {
  @ViewChild('tableView')
  public tableView!: TableViewComponent;

  @ViewChild('displayCellTemplate', { static: true })
  public displayCellTemplate!: TemplateRef<any>;

  @ViewChild('actionsCellTemplate', { static: true })
  public actionsCellTemplate!: TemplateRef<any>;

  public service: any = this.modalRef.data.service;

  public routerBaseLink?: string = this.modalRef.data.routerBaseLink;

  public restoreEmitter = this.modalRef.data.restoreEmitter;

  public listColumns: TableColumn[] = [];

  public serviceParams = new HttpParams().set('deleted', 'true');

  public loading = false;

  public state = ModalState.Unchanged;

  public constructor(public readonly modalRef: DialogRef, private readonly translocoService: TranslocoService) {}

  public ngOnInit(): void {
    this.modalRef.beforeClose(() => {
      this.restoreEmitter.emit({ state: this.state });
      return true;
    });

    this.initTranslations();
  }

  public initTranslations(): void {
    this.translocoService
      .selectTranslateObject('trash.trashModal.columns')
      .pipe(untilDestroyed(this))
      .subscribe(column => {
        this.listColumns = [
          {
            cellTemplate: this.displayCellTemplate,
            name: column.title,
            key: 'display',
          },
          {
            cellTemplate: this.actionsCellTemplate,
            name: '',
            key: 'actions',
            hideable: false,
          },
        ];
      });
  }

  public onRestore(restored: boolean): void {
    if (restored) {
      this.state = ModalState.Changed;
    }
  }
}
