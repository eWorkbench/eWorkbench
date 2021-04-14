/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { AfterViewInit, ChangeDetectionStrategy, Component, Input, Self } from '@angular/core';
import { ControlValueAccessor, NgControl } from '@angular/forms';
import { DatePickerConfig } from '@eworkbench/types';
import flatpickr from 'flatpickr';

@Component({
  selector: 'eworkbench-form-date-input',
  templateUrl: './form-date-input.component.html',
  styleUrls: ['./form-date-input.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormDateInputComponent implements ControlValueAccessor, AfterViewInit {
  @Input()
  public inputId!: string;

  @Input()
  public inputName!: string;

  @Input()
  public datePickerConfig!: DatePickerConfig;

  @Input()
  public disabled?: boolean = false;

  public onChanged: any = () => {};
  public onTouched: any = () => {};

  public constructor(@Self() public readonly ngControl: NgControl) {
    ngControl.valueAccessor = this;
  }

  public ngAfterViewInit(): void {
    flatpickr(`#${this.inputId}`, {
      ...this.datePickerConfig,
      onChange: (selectedDate, dateStr) => {
        this.writeValue(dateStr);
      },
    });
  }

  public writeValue(value: string | null): void {
    if (this.ngControl.value !== value) {
      this.onChanged(value);
    }
  }

  public registerOnChange(fn: any): void {
    this.onChanged = fn;
  }

  public registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  public setDisabledState(isDisabled?: boolean): void {
    this.disabled = isDisabled;
  }
}
