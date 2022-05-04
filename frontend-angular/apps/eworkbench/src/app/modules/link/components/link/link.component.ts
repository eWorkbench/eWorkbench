/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { ModalState } from '@app/enums/modal-state.enum';
import type { ModalCallback } from '@eworkbench/types';
import { DialogRef, DialogService } from '@ngneat/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { take } from 'rxjs/operators';
import { NewLinkModalComponent } from '../modals/new/new.component';

@UntilDestroy()
@Component({
  selector: 'eworkbench-link',
  templateUrl: './link.component.html',
  styleUrls: ['./link.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LinkComponent {
  @Input()
  public baseModel!: any;

  @Input()
  public service!: any;

  @Output()
  public refreshLinkList = new EventEmitter<boolean>();

  public loading = false;

  public modalRef?: DialogRef;

  public constructor(private readonly modalService: DialogService) {}

  public openNewLinkModal(contentType: string): void {
    this.modalRef = this.modalService.open(NewLinkModalComponent, {
      closeButton: false,
      width: '1200px',
      data: {
        contentType: contentType,
        baseModel: this.baseModel,
        service: this.service,
      },
    });

    this.modalRef.afterClosed$.pipe(untilDestroyed(this), take(1)).subscribe((callback: ModalCallback) => this.onModalClose(callback));
  }

  public onModalClose(callback?: ModalCallback): void {
    if (callback?.state === ModalState.Changed) {
      this.refreshLinkList.next(true);
    }
  }
}
