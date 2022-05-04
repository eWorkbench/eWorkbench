/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Validators } from '@angular/forms';
import type { DropdownElement, MetadataChangedSearchParameter, MetadataField } from '@eworkbench/types';
import { FormBuilder, FormControl } from '@ngneat/reactive-forms';

interface FormMetadataSearch {
  type: FormControl<string>;
  operator: FormControl<string>;
  combinationOperator: FormControl<string>;
}

@Component({
  selector: 'eworkbench-metadata-search-parameter',
  templateUrl: './search-parameter.component.html',
  styleUrls: ['./search-parameter.component.scss'],
})
export class MetadataSearchParameterComponent implements OnInit {
  @Input()
  public types!: DropdownElement[];

  @Input()
  public initialType?: string;

  @Input()
  public parameter!: MetadataField;

  @Input()
  public loading = false;

  @Output()
  public changed = new EventEmitter<MetadataChangedSearchParameter>();

  @Output()
  public remove = new EventEmitter<MetadataField>();

  @Output()
  public changeType = new EventEmitter<{ parameter: MetadataField; id: string }>();

  public selectedValues: string[] = [];

  public operators: DropdownElement[] = [];

  public readonly = false;

  public fieldData?: string[] | string;

  public combinationOperators: DropdownElement[] = [
    {
      value: 'AND',
      label: 'AND',
    },
    {
      value: 'OR',
      label: 'OR',
    },
  ];

  public equalOperator: DropdownElement[] = [
    {
      value: '=',
      label: '=',
    },
  ];

  public allOperators: DropdownElement[] = [
    {
      value: '=',
      label: '=',
    },
    {
      value: '<',
      label: '<',
    },
    {
      value: '<=',
      label: '<=',
    },
    {
      value: '>',
      label: '>',
    },
    {
      value: '>=',
      label: '>=',
    },
  ];

  public form = this.fb.group<FormMetadataSearch>({
    type: this.fb.control('', Validators.required),
    operator: this.fb.control('', Validators.required),
    combinationOperator: this.fb.control('', Validators.required),
  });

  public constructor(private readonly fb: FormBuilder) {}

  public get f() {
    return this.form.controls;
  }

  public ngOnInit(): void {
    this.initParameter();
  }

  public initParameter(): void {
    if (['text', 'gps', 'checkbox', 'selection'].includes(this.parameter.base_type!)) {
      this.operators = this.equalOperator;
    } else {
      this.operators = this.allOperators;
    }

    this.form.patchValue(
      {
        type: this.initialType!,
        operator: '=',
        combinationOperator: 'AND',
      },
      { emitEvent: false }
    );
  }

  public onRemove(): void {
    this.remove.emit(this.parameter);
  }

  public onChanged(data?: string[] | string): void {
    this.fieldData = data ?? this.fieldData!;
    this.changed.emit({
      id: this.parameter.pk!,
      type: this.f.type.value,
      operator: this.f.operator.value,
      answers: this.fieldData,
      combinationOperator: this.f.combinationOperator.value,
    });
  }

  public onChangeType(): void {
    this.changeType.emit({
      parameter: this.parameter,
      id: this.f.type.value,
    });
  }
}
