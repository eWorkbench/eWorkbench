/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectionStrategy, Component, EventEmitter, Output } from '@angular/core';
import type { ModalCallback, Version } from '@eworkbench/types';
import { DialogRef } from '@ngneat/dialog';
import { TranslocoService } from '@ngneat/transloco';

@Component({
  selector: 'eworkbench-version-preview-modal',
  templateUrl: './preview.component.html',
  styleUrls: ['./preview.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VersionPreviewModalComponent {
  public contentType: string = this.modalRef.data?.contentType ?? '';

  public version: Version = this.modalRef.data?.version;

  public versionNumber?: number = this.modalRef.data?.versionNumber;

  public versionInProgress?: number = this.modalRef.data?.versionInProgress;

  @Output()
  public closed = new EventEmitter<ModalCallback>();

  public constructor(public readonly modalRef: DialogRef, public readonly translocoService: TranslocoService) {}

  public onModalClose(callback: ModalCallback): void {
    this.closed.emit(callback);
  }
}
