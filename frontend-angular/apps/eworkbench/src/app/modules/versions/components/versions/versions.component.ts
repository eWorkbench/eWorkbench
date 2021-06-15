/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output, TemplateRef, ViewChild } from '@angular/core';
import { ModalState } from '@app/enums/modal-state.enum';
import { TableColumn, TableViewComponent } from '@eworkbench/table';
import { ModalCallback, Version } from '@eworkbench/types';
import { DialogRef, DialogService } from '@ngneat/dialog';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { parseISO } from 'date-fns';
import { take } from 'rxjs/operators';
import { FinalizeVersionModalComponent } from '../modals/finalize/finalize.component';
import { VersionPreviewModalComponent } from '../modals/preview/preview.component';

@UntilDestroy()
@Component({
  selector: 'eworkbench-versions',
  templateUrl: './versions.component.html',
  styleUrls: ['./versions.component.scss'],
})
export class VersionsComponent implements OnInit {
  @ViewChild('tableView')
  public tableView!: TableViewComponent;

  @ViewChild('numberCellTemplate', { static: true })
  public numberCellTemplate!: TemplateRef<any>;

  @ViewChild('createdAtCellTemplate', { static: true })
  public createdAtCellTemplate!: TemplateRef<any>;

  @ViewChild('createdByCellTemplate', { static: true })
  public createdByCellTemplate!: TemplateRef<any>;

  @ViewChild('summaryCellTemplate', { static: true })
  public summaryCellTemplate!: TemplateRef<any>;

  @ViewChild('restoreCellTemplate', { static: true })
  public restoreCellTemplate!: TemplateRef<any>;

  @Input()
  public service: any;

  @Input()
  public versionId!: string;

  @Input()
  public contentType?: string;

  @Input()
  public modalRef?: DialogRef;

  @Input()
  public lastModifiedAt?: string;

  @Input()
  public refresh?: EventEmitter<boolean>;

  @Input()
  public editable = false;

  @Input()
  public finalizeVersionAlwaysVisible = false;

  @Output()
  public changed = new EventEmitter<ModalCallback>();

  public listColumns: TableColumn[] = [];

  public data: any[] = [];

  public loading = false;

  public versionInProgress: number | null = null;

  public constructor(
    private readonly translocoService: TranslocoService,
    private readonly cdr: ChangeDetectorRef,
    private readonly modalService: DialogService
  ) {}

  public ngOnInit(): void {
    /* istanbul ignore next */
    this.refresh?.pipe(untilDestroyed(this)).subscribe(() => {
      this.getVersions();
    });

    this.initTranslations();
    this.getVersions();
  }

  public initTranslations(): void {
    this.translocoService
      .selectTranslateObject('versions.columns')
      .pipe(untilDestroyed(this))
      .subscribe(column => {
        this.listColumns = [
          {
            cellTemplate: this.numberCellTemplate,
            name: column.number,
            key: 'number',
          },
          {
            cellTemplate: this.createdAtCellTemplate,
            name: column.createdAt,
            key: 'created_at',
          },
          {
            cellTemplate: this.createdByCellTemplate,
            name: column.createdBy,
            key: 'created_by',
          },
          {
            cellTemplate: this.summaryCellTemplate,
            name: column.summary,
            key: 'summary',
          },
          {
            cellTemplate: this.restoreCellTemplate,
            name: '',
            key: 'restore',
          },
        ];
      });
  }

  public updateVersionInProgress(): void {
    if (this.data.length === 0 || this.isLastVersionModified() || this.finalizeVersionAlwaysVisible) {
      this.versionInProgress = this.getNextVersionNumber();
    } else {
      this.versionInProgress = null;
    }
  }

  public isLastVersionModified(): boolean {
    let isModified = false;
    const lastVersion = this.getLastVersion();

    if (lastVersion) {
      const now = new Date();

      const createdAtTimestamp = parseISO(lastVersion.created_at!);
      const lastModifiedAtTimestamp = this.lastModifiedAt ? parseISO(this.lastModifiedAt) : now;

      isModified = createdAtTimestamp < lastModifiedAtTimestamp;
    }

    return isModified;
  }

  public getLastVersion(): Version | null {
    return this.data.length ? this.data[0] : null;
  }

  public getNextVersionNumber(): number {
    return this.data.length + 1;
  }

  public appendVersionInProgress(): void {
    if (this.versionInProgress) {
      this.data = [{ number: this.getNextVersionNumber() }, ...this.data];
    }
  }

  public getVersions(): void {
    this.loading = true;

    this.service
      ?.versions(this.versionId)
      .pipe(untilDestroyed(this))
      .subscribe(
        /* istanbul ignore next */ (versions: Version[]) => {
          this.data = [...versions];

          this.updateVersionInProgress();
          this.appendVersionInProgress();

          this.loading = false;
          this.cdr.markForCheck();
        },
        /* istanbul ignore next */ () => {
          this.loading = false;
          this.cdr.markForCheck();
        }
      );
  }

  public onPreviewModal(version: Version, versionNumber?: number): void {
    /* istanbul ignore next */
    this.modalRef = this.modalService.open(VersionPreviewModalComponent, {
      closeButton: false,
      data: {
        contentType: this.contentType,
        version: version,
        versionNumber: versionNumber,
        versionInProgress: this.versionInProgress,
      },
    });
    /* istanbul ignore next */
    this.modalRef.afterClosed$.pipe(untilDestroyed(this), take(1)).subscribe((callback: ModalCallback) => this.onModalClose(callback));
  }

  // TODO: Open a modal to finalize a version on every 8th change since the last version
  public onFinalizeVersionModal(): void {
    /* istanbul ignore next */
    this.modalRef = this.modalService.open(FinalizeVersionModalComponent, {
      closeButton: false,
      data: { service: this.service, id: this.versionId },
    });
    /* istanbul ignore next */
    this.modalRef.afterClosed$.pipe(untilDestroyed(this), take(1)).subscribe((callback: ModalCallback) => this.onModalClose(callback));
  }

  public onModalClose(callback?: ModalCallback): void {
    if (callback?.state === ModalState.Changed) {
      this.changed.emit({ state: callback.state });
    }
  }
}
