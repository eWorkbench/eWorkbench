/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Validators } from '@angular/forms';
import { ModalState } from '@app/enums/modal-state.enum';
import { DssContainersService } from '@app/services';
import type { DropdownElement, DssContainer, DssContainerPayload } from '@eworkbench/types';
import { DialogRef } from '@ngneat/dialog';
import { FormBuilder, FormControl } from '@ngneat/reactive-forms';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ToastrService } from 'ngx-toastr';

interface FormDssContainer {
  name: FormControl<string | null>;
  path: FormControl<string | null>;
  readWriteSetting: FormControl<DssContainerPayload['read_write_setting']>;
  importOption: FormControl<DssContainerPayload['import_option']>;
}

@UntilDestroy()
@Component({
  selector: 'eworkbench-new-dss-container-modal',
  templateUrl: './new.component.html',
  styleUrls: ['./new.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewDssContainerModalComponent implements OnInit {
  public initialState?: DssContainer = this.modalRef.data?.initialState;

  public loading = false;

  public state = ModalState.Unchanged;

  public readWriteSettings: DropdownElement[] = [];

  public importOptions: DropdownElement[] = [];

  public form = this.fb.group<FormDssContainer>({
    name: this.fb.control(null, Validators.required),
    path: this.fb.control(null, Validators.required),
    readWriteSetting: this.fb.control('RO', Validators.required),
    importOption: this.fb.control('ION', Validators.required),
  });

  public constructor(
    public readonly modalRef: DialogRef,
    private readonly dssContainersService: DssContainersService,
    private readonly fb: FormBuilder,
    private readonly translocoService: TranslocoService,
    private readonly cdr: ChangeDetectorRef,
    private readonly toastrService: ToastrService
  ) {}

  public get f() {
    return this.form.controls;
  }

  public get dssContainer(): DssContainerPayload {
    return {
      name: this.f.name.value!,
      path: this.f.path.value!,
      read_write_setting: this.f.readWriteSetting.value,
      import_option: this.f.importOption.value,
    };
  }

  public ngOnInit(): void {
    this.initTranslations();
    this.patchFromValues();
  }

  public initTranslations(): void {
    this.translocoService
      .selectTranslateObject('dssContainers.readWriteSetting')
      .pipe(untilDestroyed(this))
      .subscribe(readWriteSetting => {
        this.readWriteSettings = [
          {
            label: readWriteSetting.readOnly,
            value: 'RO',
          },
          {
            label: readWriteSetting.readWriteNoNew,
            value: 'RWNN',
          },
          {
            label: readWriteSetting.readWriteOnlyNew,
            value: 'RWON',
          },
          {
            label: readWriteSetting.readWriteAll,
            value: 'RWA',
          },
        ];
      });

    this.translocoService
      .selectTranslateObject('dssContainers.importOption')
      .pipe(untilDestroyed(this))
      .subscribe(importOption => {
        this.importOptions = [
          {
            label: importOption.importOnlyNew,
            value: 'ION',
          },
          {
            label: importOption.importList,
            value: 'IL',
          },
          {
            label: importOption.importAll,
            value: 'IA',
          },
        ];
      });
  }

  public patchFromValues(): void {
    if (this.initialState) {
      this.form.patchValue({
        name: this.initialState.name,
        path: this.initialState.path,
        readWriteSetting: this.initialState.read_write_setting,
        importOption: this.initialState.import_option,
      });
    }
  }

  public onSubmit(): void {
    if (this.loading) {
      return;
    }
    this.loading = true;

    this.dssContainersService
      .add(this.dssContainer)
      .pipe(untilDestroyed(this))
      .subscribe(
        dssContainer => {
          this.state = ModalState.Changed;
          this.modalRef.close({
            state: this.state,
            data: { newContent: dssContainer },
            navigate: ['/dsscontainers', dssContainer.pk],
          });
          this.toastrService.success(this.translocoService.translate('dssContainer.newModal.toastr.success'));
        },
        () => {
          this.loading = false;
          this.cdr.markForCheck();
        }
      );
  }
}
