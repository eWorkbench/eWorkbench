/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, Input, ChangeDetectorRef, ChangeDetectionStrategy, Output, EventEmitter } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { TranslocoService } from '@ngneat/transloco';
import { TableViewComponent, TreeViewComponent } from '@eworkbench/table';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: 'eworkbench-restore-button',
  templateUrl: './restore-button.component.html',
  styleUrls: ['./restore-button.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RestoreButtonComponent {
  @Input()
  public id!: string;

  @Input()
  public service!: any;

  @Input()
  public tableView?: TableViewComponent | TreeViewComponent;

  @Output()
  public restored = new EventEmitter<boolean>();

  public loading = false;

  public constructor(
    private readonly toastrService: ToastrService,
    private readonly translocoService: TranslocoService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  public onRestore(id: string): void {
    if (this.loading) {
      return;
    }
    this.loading = true;

    this.service
      .restore(id)
      .pipe(untilDestroyed(this))
      .subscribe(
        /* istanbul ignore next */ () => {
          this.tableView?.loadData();
          this.restored.emit(true);
          this.loading = false;
          this.cdr.markForCheck();
          this.translocoService
            .selectTranslate('trash.trashModal.toastr.success')
            .pipe(untilDestroyed(this))
            .subscribe(success => {
              this.toastrService.success(success);
            });
        },
        /* istanbul ignore next */ () => {
          this.restored.emit(false);
          this.loading = false;
          this.cdr.markForCheck();
        }
      );
  }
}
