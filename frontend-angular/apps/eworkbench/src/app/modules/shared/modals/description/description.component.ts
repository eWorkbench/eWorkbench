/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ModalState } from '@app/enums/modal-state.enum';
import { DialogRef } from '@ngneat/dialog';
import { FormBuilder, FormGroup } from '@ngneat/reactive-forms';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ToastrService } from 'ngx-toastr';

interface FormDescription {
  content: string | null;
}

@UntilDestroy()
@Component({
  selector: 'eworkbench-description-modal',
  templateUrl: './description.component.html',
  styleUrls: ['./description.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DescriptionModalComponent implements OnInit {
  public id: string = this.modalRef.data.id;

  public service: any = this.modalRef.data.service;

  public initialDescription: any = this.modalRef.data.description;

  public descriptionKey: string = this.modalRef.data.descriptionKey;

  public loading = false;

  public state = ModalState.Unchanged;

  public form: FormGroup<FormDescription> = this.fb.group<FormDescription>({
    content: [null],
  });

  public constructor(
    public readonly modalRef: DialogRef,
    private readonly fb: FormBuilder,
    private readonly cdr: ChangeDetectorRef,
    private readonly translocoService: TranslocoService,
    private readonly toastrService: ToastrService
  ) {}

  public get f(): FormGroup<FormDescription>['controls'] {
    return this.form.controls;
  }

  public get headerTranslationKey(): string {
    return this.initialDescription ? 'shared.descriptionModal.editDescription' : 'shared.descriptionModal.addDescription';
  }

  public get toastrSuccessTranslationKey(): string {
    return this.initialDescription ? 'shared.descriptionModal.toastr.edited' : 'shared.descriptionModal.toastr.added';
  }

  public get description(): any {
    return {
      [this.descriptionKey]: this.f.content.value,
    };
  }

  public ngOnInit(): void {
    this.f.content.setValue(this.initialDescription);
  }

  public onSubmit(): void {
    if (this.loading) {
      return;
    }
    this.loading = true;

    this.service
      .patch(this.id, this.description)
      .pipe(untilDestroyed(this))
      .subscribe(
        (response: any) => {
          this.state = ModalState.Changed;
          this.loading = false;
          this.modalRef.close({ state: this.state, data: response });
          this.translocoService
            .selectTranslate(this.toastrSuccessTranslationKey)
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
