/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { ModalState } from '@app/enums/modal-state.enum';
import { DialogRef } from '@ngneat/dialog';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ToastrService } from 'ngx-toastr';

@UntilDestroy()
@Component({
  selector: 'eworkbench-delete-link',
  templateUrl: './delete-link.component.html',
  styleUrls: ['./delete-link.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeleteLinkComponent {
  public service: any = this.modalRef.data.service;

  public baseModelId: string = this.modalRef.data.baseModelId;

  public relationId: string = this.modalRef.data.relationId;

  public loading = false;

  public state = ModalState.Unchanged;

  public constructor(
    public readonly modalRef: DialogRef,
    private readonly translocoService: TranslocoService,
    private readonly toastrService: ToastrService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  public onDelete(): void {
    if (this.loading) {
      return;
    }
    this.loading = true;

    this.service
      .deleteRelation(this.baseModelId, this.relationId)
      .pipe(untilDestroyed(this))
      .subscribe(
        () => {
          this.state = ModalState.Changed;
          this.modalRef.close({ state: this.state });
          this.translocoService
            .selectTranslate('link.deleteModal.toastr.success')
            .pipe(untilDestroyed(this))
            .subscribe(success => {
              this.toastrService.success(success);
            });
        },
        () => {
          this.loading = false;
          this.cdr.markForCheck();
        }
      );
  }
}
