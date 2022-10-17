/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Validators } from '@angular/forms';
import { ModalState } from '@app/enums/modal-state.enum';
import { AuthService, MetadataService } from '@app/services';
import type { DropdownElement, MetadataPayload, User } from '@eworkbench/types';
import { DialogRef } from '@ngneat/dialog';
import { FormArray, FormBuilder, FormControl } from '@ngneat/reactive-forms';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ToastrService } from 'ngx-toastr';

interface FormMetadata {
  name: FormControl<string | null>;
  description: FormControl<string | null>;
  baseType: string | null;
  final?: boolean;
  answers?: FormArray<string[]>;
  multipleSelect?: boolean;
  decimals?: number | null;
  thousandsSeparator?: boolean;
  symbol?: string | null;
}

@UntilDestroy()
@Component({
  selector: 'eworkbench-new-metadata-modal',
  templateUrl: './new.component.html',
  styleUrls: ['./new.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewMetadataFieldComponent implements OnInit {
  public name?: string = this.modalRef.data?.name ?? null;

  public baseTypes: DropdownElement[] = [];

  public currentUser: User | null = null;

  public canAddNewFields = false;

  public loading = false;

  public state = ModalState.Unchanged;

  public form = this.fb.group<FormMetadata>({
    name: this.fb.control(null, Validators.required),
    description: this.fb.control(null, Validators.required),
    baseType: null,
    final: false,
    answers: this.fb.array([]),
    multipleSelect: false,
    decimals: null,
    thousandsSeparator: false,
    symbol: null,
  });

  public constructor(
    public readonly modalRef: DialogRef,
    private readonly metadataService: MetadataService,
    private readonly authService: AuthService,
    private readonly fb: FormBuilder,
    private readonly cdr: ChangeDetectorRef,
    private readonly translocoService: TranslocoService,
    private readonly toastrService: ToastrService
  ) {}

  public get f() {
    return this.form.controls;
  }

  public get answers(): FormArray<string> {
    return this.form.get('answers') as any;
  }

  public get metadata(): MetadataPayload {
    const baseType = this.f.baseType.value!;

    const metadata: MetadataPayload = {
      name: this.f.name.value,
      description: this.f.description.value ?? '',
      base_type: baseType,
      type_settings: {},
    };

    if (baseType === 'whole_number') {
      metadata.type_settings.thousands_separator = this.f.thousandsSeparator!.value;
    } else if (baseType === 'decimal_number') {
      metadata.type_settings.decimals = Number(this.f.decimals!.value);
      metadata.type_settings.thousands_separator = this.f.thousandsSeparator!.value;
    } else if (baseType === 'currency') {
      metadata.type_settings.decimals = Number(this.f.decimals!.value);
      metadata.type_settings.symbol = this.f.symbol!.value;
    } else if (baseType === 'percentage') {
      metadata.type_settings.decimals = Number(this.f.decimals!.value);
    } else if (baseType === 'selection') {
      metadata.type_settings.answers = this.answers.value;
      metadata.type_settings.multiple_select = this.f.multipleSelect!.value;
      metadata.type_settings.final = this.f.final!.value;
    }

    return metadata;
  }

  public ngOnInit(): void {
    this.authService.user$.pipe(untilDestroyed(this)).subscribe(state => {
      this.currentUser = state.user;
      if (this.currentUser?.permissions?.includes('metadata.add_metadatafield')) {
        this.canAddNewFields = true;
      }
      this.cdr.markForCheck();
    });

    this.initTranslations();
    this.patchFormValues();

    for (let i = 0; i < 3; i++) {
      this.onAddAnswer();
    }
  }

  public initTranslations(): void {
    this.translocoService
      .selectTranslateObject('metadata.baseTypes')
      .pipe(untilDestroyed(this))
      .subscribe(baseTypes => {
        this.baseTypes = [
          {
            value: 'whole_number',
            label: baseTypes.integer,
          },
          {
            value: 'decimal_number',
            label: baseTypes.decimalNumber,
          },
          {
            value: 'currency',
            label: baseTypes.currency,
          },
          {
            value: 'date',
            label: baseTypes.date,
          },
          {
            value: 'real_date',
            label: baseTypes.realDate,
          },
          {
            value: 'time',
            label: baseTypes.time,
          },
          {
            value: 'percentage',
            label: baseTypes.percentage,
          },
          {
            value: 'text',
            label: baseTypes.text,
          },
          {
            value: 'fraction',
            label: baseTypes.fraction,
          },
          {
            value: 'gps',
            label: baseTypes.gps,
          },
          {
            value: 'checkbox',
            label: baseTypes.checkbox,
          },
          {
            value: 'selection',
            label: baseTypes.selection,
          },
          {
            value: 'tag',
            label: baseTypes.tag,
          },
        ];
      });
  }

  public patchFormValues(): void {
    this.form.patchValue(
      {
        name: this.name!,
        baseType: 'whole_number',
        final: true,
        multipleSelect: true,
        thousandsSeparator: true,
      },
      { emitEvent: false }
    );
  }

  public onSubmit(): void {
    if (this.loading) {
      return;
    }
    this.loading = true;

    this.metadataService
      .add(this.metadata)
      .pipe(untilDestroyed(this))
      .subscribe(
        metadata => {
          this.state = ModalState.Changed;
          this.modalRef.close({ state: this.state, data: metadata.pk });
          this.translocoService
            .selectTranslate('metadata.newModal.toastr.success')
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

  public onAddAnswer(): void {
    this.answers.push(this.fb.control(''));
  }

  public onRemoveAnswer(element: number): void {
    if (!this.loading) {
      this.answers.removeAt(element);
    }
  }
}
