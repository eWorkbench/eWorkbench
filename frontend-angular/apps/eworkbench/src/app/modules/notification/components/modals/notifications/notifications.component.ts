/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectionStrategy, Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { NotificationsService } from '@app/services/notifications/notifications.service';
import { TableColumn, TableViewComponent } from '@eworkbench/table';
import { DialogRef } from '@ngneat/dialog';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: 'eworkbench-notifications-modal',
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationsModalComponent implements OnInit {
  @ViewChild('tableView')
  public tableView!: TableViewComponent;

  @ViewChild('containerCellTemplate', { static: true })
  public containerCellTemplate!: TemplateRef<any>;

  public loading = false;

  public listColumns: TableColumn[] = [];

  public constructor(
    public readonly modalRef: DialogRef,
    public readonly notificationsService: NotificationsService,
    private readonly translocoService: TranslocoService
  ) {}

  public ngOnInit(): void {
    this.initTranslations();
  }

  public initTranslations(): void {
    this.translocoService
      .selectTranslateObject('notifications.columns')
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
  }
}
