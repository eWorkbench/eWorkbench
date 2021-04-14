/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { Validators } from '@angular/forms';
import { ModalState } from '@app/enums/modal-state.enum';
import { LabelsService } from '@app/services';
import { LabelPayload } from '@eworkbench/types';
import { DialogRef } from '@ngneat/dialog';
import { FormBuilder, FormGroup } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

interface FormLabel {
  name: string | null;
  color: string | null;
}

@UntilDestroy()
@Component({
  selector: 'eworkbench-new-label-modal',
  templateUrl: './new.component.html',
  styleUrls: ['./new.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewLabelModalComponent {
  public state = ModalState.Unchanged;

  public loading = false;

  public form = this.fb.group<FormLabel>({
    name: [null],
    color: [null, [Validators.required]],
  });

  public constructor(
    public readonly modalRef: DialogRef,
    private readonly labelsService: LabelsService,
    private readonly fb: FormBuilder,
    private readonly cdr: ChangeDetectorRef
  ) {}

  public get f(): FormGroup<FormLabel>['controls'] {
    /* istanbul ignore next */
    return this.form.controls;
  }

  public get label(): LabelPayload {
    return {
      name: this.f.name.value ?? '',
      color: this.f.color.value!,
    };
  }

  public onSubmit(): void {
    if (this.loading) {
      return;
    }
    this.loading = true;

    this.labelsService
      .add(this.label)
      .pipe(untilDestroyed(this))
      .subscribe(
        label => {
          this.state = ModalState.Changed;
          this.modalRef.close({ state: this.state, data: label });
        },
        () => {
          this.loading = false;
          this.cdr.markForCheck();
        }
      );
  }
}
