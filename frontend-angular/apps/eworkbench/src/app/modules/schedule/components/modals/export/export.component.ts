/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Clipboard } from '@angular/cdk/clipboard';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { MyScheduleService } from '@app/services';
import { DialogRef } from '@ngneat/dialog';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ToastrService } from 'ngx-toastr';

@UntilDestroy()
@Component({
  selector: 'eworkbench-schedule-export-modal',
  templateUrl: './export.component.html',
  styleUrls: ['./export.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExportModalComponent implements OnInit {
  public iCalExportUrl?: string;

  public constructor(
    public readonly modalRef: DialogRef,
    private readonly clipboard: Clipboard,
    private readonly myScheduleService: MyScheduleService,
    private readonly cdr: ChangeDetectorRef,
    private readonly toastrService: ToastrService,
    private readonly translocoService: TranslocoService
  ) {}

  public ngOnInit(): void {
    this.initDetails();
  }

  public initDetails(): void {
    this.myScheduleService
      .export()
      .pipe(untilDestroyed(this))
      .subscribe(
        exportLink => {
          this.iCalExportUrl = exportLink.url;
          this.cdr.markForCheck();
        },
        () => {
          this.cdr.markForCheck();
        }
      );
  }

  public onCopyExportUrlToClipboard(): void {
    this.clipboard.copy(this.iCalExportUrl ?? '');
    this.translocoService
      .selectTranslate('schedule.exportModal.success.exportUrlCopiedToClipboard')
      .pipe(untilDestroyed(this))
      .subscribe(exportUrlCopiedToClipboard => {
        this.toastrService.success(exportUrlCopiedToClipboard);
      });
  }
}
