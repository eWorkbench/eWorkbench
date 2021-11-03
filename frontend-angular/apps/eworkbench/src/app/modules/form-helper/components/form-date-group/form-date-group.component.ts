/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit, Self } from '@angular/core';
import { NgControl, Validators } from '@angular/forms';
import { DateGroup, DatePickerConfig } from '@eworkbench/types';
import { FormBuilder, FormGroup } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { format, parseISO, set } from 'date-fns';
import flatpickr from 'flatpickr';
import { Instance } from 'flatpickr/dist/types/instance';
import { v4 as uuidv4 } from 'uuid';

interface FormDateGroup {
  start: string | null;
  end: string | null;
  fullDay: boolean;
}

@UntilDestroy()
@Component({
  selector: 'eworkbench-form-date-group',
  templateUrl: './form-date-group.component.html',
  styleUrls: ['./form-date-group.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormDateGroupComponent implements OnInit, AfterViewInit {
  // eslint-disable-next-line @angular-eslint/no-input-rename
  @Input('value')
  public _value: DateGroup = {
    start: null,
    end: null,
    fullDay: false,
  };

  @Input()
  public required = false;

  @Input()
  public fullDayToggle = true;

  @Input()
  public endDate = true;

  @Input()
  public labels = true;

  @Input()
  public placeholders = true;

  @Input()
  public customLabel = {
    start: null,
    end: null,
  };

  @Input()
  public customPlaceholder = {
    start: null,
    end: null,
  };

  public onChange: any = () => {};

  public onTouch: any = () => {};

  public readonly dateFormat = 'yyyy-MM-dd';

  public readonly datePickerDateFormat = 'Y-m-d';

  public readonly dateTimeFormat = "yyyy-MM-dd HH':'mm";

  public readonly datePickerDateTimeFormat = 'Y-m-d H:i';

  public uniqueHash = uuidv4();

  public startDatePicker?: Instance;

  public endDatePicker?: Instance;

  public datePickerConfig: DatePickerConfig = {
    dateFormat: 'Y-m-d H:i',
    enableTime: true,
    time_24hr: true,
    minuteIncrement: 1,
    locale: {
      firstDayOfWeek: 1,
    },
  };

  public viewInitialized = false;

  public form: FormGroup<FormDateGroup> = this.fb.group({
    start: [null],
    end: [null],
    fullDay: [false],
  });

  public fullDayToggleTriggered = false;

  private initialValue?: DateGroup;

  public constructor(
    @Self() private readonly ngControl: NgControl,
    private readonly fb: FormBuilder,
    private readonly cdr: ChangeDetectorRef
  ) {
    this.ngControl.valueAccessor = this;
  }

  public get f(): FormGroup<FormDateGroup>['controls'] {
    return this.form.controls;
  }

  public get value(): FormDateGroup {
    return this._value;
  }

  public set value(dateGroup: FormDateGroup) {
    const value = { ...dateGroup };
    this._value = value;
    this.setInitialValue(value);

    this.onChange(value);
    this.onTouch(value);

    this.form.patchValue(
      {
        start: value.start,
        end: value.end,
        fullDay: value.fullDay,
      },
      { emitEvent: false }
    );

    if (this.viewInitialized) {
      if (value.start) {
        this.startDatePicker?.setDate(Date.parse(value.start));
      }
      if (value.end) {
        this.endDatePicker?.setDate(Date.parse(value.end));
      }
      this.setDatePickerConfig(value.fullDay);
      this.formatDates();
    }
  }

  public ngOnInit(): void {
    if (this.required) {
      this.f.start.setValidators([Validators.required]);
      this.f.end.setValidators([Validators.required]);
    }
  }

  public ngAfterViewInit(): void {
    /* istanbul ignore next */
    this.f.fullDay.value$.pipe(untilDestroyed(this)).subscribe(
      /* istanbul ignore next */ fullDay => {
        this.setFullDayToggleTriggered(fullDay);
        this.value.fullDay = fullDay;
        this.formatDates();
      }
    );

    this.setDatePicker();
    this.viewInitialized = true;

    setTimeout(() => this.ngControl.control?.markAsPristine(), 500);
  }

  public setDatePicker(): void {
    this.startDatePicker = flatpickr(`#startDate${this.uniqueHash}`, {
      ...this.datePickerConfig,
      onChange: (selectedDate, dateStr) => {
        this.f.start.setValue(dateStr);
        this.onRefreshDateValues();
      },
    }) as Instance;
    this.endDatePicker = flatpickr(`#endDate${this.uniqueHash}`, {
      ...this.datePickerConfig,
      onChange: (selectedDate, dateStr) => {
        this.f.end.setValue(dateStr);
        this.onRefreshDateValues();
      },
    }) as Instance;
  }

  public registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  public registerOnTouched(fn: any): void {
    this.onTouch = fn;
  }

  public writeValue(value: DateGroup): void {
    this.value = value;
  }

  public patchForm(): void {
    this.form.patchValue({
      start: this.value.start,
      end: this.value.end,
    });

    this.form.clearValidators();
    this.f.start.setErrors(null);
    this.f.end.setErrors(null);

    if (this.ngControl.disabled) {
      this.form.disable();
    }

    this.onChange(this.value);
    this.onTouch(this.value);
    this.cdr.detectChanges();
  }

  public onRefreshDateValues(): void {
    this.value.start = this.f.start.value;
    this.value.end = this.f.end.value;

    this.onChange(this.value);
    this.onTouch(this.value);
  }

  public formatDates(): void {
    if (this.value.fullDay) {
      this.value.start = this.value.start ? format(Date.parse(this.value.start), this.dateFormat) : null;
      this.value.end = this.value.end ? format(Date.parse(this.value.end), this.dateFormat) : null;
    } else if (this.fullDayToggleTriggered) {
      const currentDate = new Date();
      this.value.start = format(
        set(parseISO(this.value.start ?? currentDate.toISOString()), {
          hours: currentDate.getHours() + 1,
          minutes: 0,
          seconds: 0,
        }),
        this.dateTimeFormat
      );
      this.value.end = format(
        set(parseISO(this.value.end ?? currentDate.toISOString()), {
          hours: currentDate.getHours() + 2,
          minutes: 0,
          seconds: 0,
        }),
        this.dateTimeFormat
      );
    } else {
      this.value.start = this.value.start ? format(Date.parse(this.value.start), this.dateTimeFormat) : null;
      this.value.end = this.value.end ? format(Date.parse(this.value.end), this.dateTimeFormat) : null;
    }

    this.setDatePickerConfig(this.value.fullDay);

    if (this.value.start) {
      this.startDatePicker?.setDate(Date.parse(this.value.start));
    }
    if (this.value.end) {
      this.endDatePicker?.setDate(Date.parse(this.value.end));
    }

    this.patchForm();
  }

  public setInitialValue(dateGroup: DateGroup): void {
    this.initialValue = { ...dateGroup };
    this.fullDayToggleTriggered = false;
    this.setDatePickerConfig(dateGroup.fullDay);
  }

  public setFullDayToggleTriggered(fullDay: boolean): void {
    if (fullDay !== this.initialValue?.fullDay) {
      this.fullDayToggleTriggered = true;
    }
  }

  public setDatePickerConfig(fullDay?: boolean): void {
    if (fullDay) {
      this.datePickerConfig = { ...this.datePickerConfig, dateFormat: this.datePickerDateFormat, enableTime: false };
    } else {
      this.datePickerConfig = { ...this.datePickerConfig, dateFormat: this.datePickerDateTimeFormat, enableTime: true };
    }
    this.setDatePicker();
  }
}
