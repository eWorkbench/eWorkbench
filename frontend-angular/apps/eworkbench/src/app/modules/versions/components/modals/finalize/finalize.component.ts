/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { ModalState } from '@app/enums/modal-state.enum';
import type { FinalizeVersion } from '@eworkbench/types';
import { DialogRef } from '@ngneat/dialog';
import { FormBuilder } from '@ngneat/reactive-forms';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ToastrService } from 'ngx-toastr';

interface FormFinalizeVersion {
  summary: string | null;
}

@UntilDestroy()
@Component({
  selector: 'eworkbench-finalize-version-modal',
  templateUrl: './finalize.component.html',
  styleUrls: ['./finalize.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FinalizeVersionModalComponent {
  public id: string = this.modalRef.data?.id ?? '';

  public service: any = this.modalRef.data?.service;

  public state = ModalState.Unchanged;

  public loading = false;

  public form = this.fb.group<FormFinalizeVersion>({
    summary: null,
  });

  public constructor(
    public readonly modalRef: DialogRef,
    private readonly fb: FormBuilder,
    private readonly translocoService: TranslocoService,
    private readonly toastrService: ToastrService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  public get f() {
    return this.form.controls;
  }

  private get version(): FinalizeVersion {
    return {
      summary: this.f.summary.value ?? '',
    };
  }

  public onFinalizeVersion(): void {
    if (this.loading) {
      return;
    }
    this.loading = true;

    this.service
      .addVersion(this.id, this.version)
      .pipe(untilDestroyed(this))
      .subscribe(
        () => {
          this.state = ModalState.Changed;
          this.modalRef.close({ state: this.state });
          this.translocoService
            .selectTranslate('versions.toastr.success.versionFinalized')
            .pipe(untilDestroyed(this))
            .subscribe(versionFinalized => {
              this.toastrService.success(versionFinalized);
            });
        },
        () => {
          this.loading = false;
          this.cdr.markForCheck();
        }
      );
  }
}
