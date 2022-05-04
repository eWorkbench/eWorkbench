/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectionStrategy, Component, Input, OnInit, Self } from '@angular/core';
import { NgControl, Validators } from '@angular/forms';
import type { DropdownElement, TimeGroup } from '@eworkbench/types';
import { FormBuilder } from '@ngneat/reactive-forms';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { skip } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';

interface FormTimeGroup {
  time: number | null;
  unit: 'MINUTE' | 'HOUR' | 'DAY' | 'WEEK' | null;
}

@UntilDestroy()
@Component({
  selector: 'eworkbench-form-time-group',
  templateUrl: './form-time-group.component.html',
  styleUrls: ['./form-time-group.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormTimeGroupComponent implements OnInit {
  // eslint-disable-next-line @angular-eslint/no-input-rename
  @Input('value')
  public _value: TimeGroup = {
    time: null,
    unit: null,
  };

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  public onChanged: any = () => {};
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  public onTouched: any = () => {};

  public uniqueHash = uuidv4();

  public form = this.fb.group<FormTimeGroup>({
    time: null,
    unit: null,
  });

  public remindAttendingUnits: DropdownElement[] = [];

  public constructor(
    @Self() private readonly ngControl: NgControl,
    private readonly fb: FormBuilder,
    private readonly translocoService: TranslocoService
  ) {
    this.ngControl.valueAccessor = this;
  }

  public get f() {
    return this.form.controls;
  }

  public get value(): FormTimeGroup {
    return this._value;
  }

  public set value(timeGroup: TimeGroup) {
    const value = { ...timeGroup };
    this._value = value;

    this.form.patchValue(
      {
        time: value.time,
        unit: value.unit,
      },
      { emitEvent: false }
    );
  }

  public registerOnChange(fn: any): void {
    this.onChanged = fn;
  }

  public registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  public writeValue(value: TimeGroup): void {
    this.value = value;
  }

  public ngOnInit(): void {
    this.f.time.setValidators([Validators.required]);
    this.f.unit.setValidators([Validators.required]);

    this.initTranslations();

    this.form.value$.pipe(untilDestroyed(this), skip(1)).subscribe(value => {
      this.onChanged(value);
      this.onTouched(value);
    });
  }

  public emitChanges(): void {
    this.writeValue({
      time: this.f.time.value,
      unit: this.f.unit.value,
    });
  }

  public initTranslations(): void {
    this.translocoService
      .selectTranslateObject('formTimeGroup.remindAttendingUnits')
      .pipe(untilDestroyed(this))
      .subscribe(remindAttendingUnits => {
        this.remindAttendingUnits = [
          { value: 'MINUTE', label: remindAttendingUnits.minutes },
          { value: 'HOUR', label: remindAttendingUnits.hours },
          { value: 'DAY', label: remindAttendingUnits.days },
          { value: 'WEEK', label: remindAttendingUnits.weeks },
        ];
      });
  }
}
