/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Validators } from '@angular/forms';
import { ModalState } from '@app/enums/modal-state.enum';
import { DrivesService } from '@app/services';
import { Directory, DirectoryPayload, Drive } from '@eworkbench/types';
import { DialogRef } from '@ngneat/dialog';
import { FormBuilder, FormGroup } from '@ngneat/reactive-forms';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ToastrService } from 'ngx-toastr';

interface FormDirectory {
  title: string | null;
  parent: string | null;
}

@UntilDestroy()
@Component({
  selector: 'eworkbench-edit-storage-directory-modal',
  templateUrl: './edit.component.html',
  styleUrls: ['./edit.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditStorageDirectoryModalComponent implements OnInit {
  public initialState?: Directory = this.modalRef.data?.initialState;

  public storage?: Drive = this.modalRef.data?.storage;

  public loading = false;

  public state = ModalState.Unchanged;

  public form = this.fb.group<FormDirectory>({
    title: [null, [Validators.required]],
    parent: [null],
  });

  public constructor(
    public readonly modalRef: DialogRef,
    private readonly fb: FormBuilder,
    private readonly drivesService: DrivesService,
    private readonly toastrService: ToastrService,
    private readonly translocoService: TranslocoService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  public get f(): FormGroup<FormDirectory>['controls'] {
    return this.form.controls;
  }

  public get directory(): DirectoryPayload {
    return {
      name: this.f.title.value!,
      directory: this.f.parent.value!,
    };
  }

  public ngOnInit(): void {
    this.patchFormValues();
  }

  public patchFormValues(): void {
    if (this.initialState) {
      this.form.patchValue({ title: this.initialState.name, parent: this.initialState.directory }, { emitEvent: false });
    }
  }

  public onSubmit(): void {
    if (this.initialState) {
      if (this.loading) {
        return;
      }
      this.loading = true;

      this.drivesService
        .patchDirectory(this.initialState.drive_id, this.initialState.pk, this.directory)
        .pipe(untilDestroyed(this))
        .subscribe(
          /* istanbul ignore next */ directory => {
            this.state = ModalState.Changed;
            this.modalRef.close({ state: this.state, data: { newContent: directory } });
            this.translocoService
              .selectTranslate('storages.editFolder.toastr.success')
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
}
