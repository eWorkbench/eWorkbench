/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { ModalState } from '@app/enums/modal-state.enum';
import { ResourcesService } from '@app/services';
import { DialogRef } from '@ngneat/dialog';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ToastrService } from 'ngx-toastr';

@UntilDestroy()
@Component({
  selector: 'eworkbench-remove-resource-pdf-modal',
  templateUrl: './remove-pdf.component.html',
  styleUrls: ['./remove-pdf.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RemoveResourcePDFModalComponent {
  public id = this.modalRef.data.id;

  public state = ModalState.Unchanged;

  public loading = false;

  public constructor(
    public readonly modalRef: DialogRef,
    private readonly resourcesService: ResourcesService,
    private readonly cdr: ChangeDetectorRef,
    private readonly translocoService: TranslocoService,
    private readonly toastrService: ToastrService
  ) {}

  public onSubmit(): void {
    if (this.loading) {
      return;
    }
    this.loading = true;

    this.resourcesService
      .patch(this.id, { terms_of_use_pdf: null })
      .pipe(untilDestroyed(this))
      .subscribe(
        /* istanbul ignore next */ () => {
          this.state = ModalState.Changed;
          this.modalRef.close({ state: this.state });
          this.translocoService
            .selectTranslate('resource.removePDFModal.toastr.success')
            .pipe(untilDestroyed(this))
            .subscribe(success => {
              this.toastrService.success(success);
            });
        },
        /* istanbul ignore next */ () => {
          this.loading = false;
          this.cdr.markForCheck();
        }
      );
  }
}
