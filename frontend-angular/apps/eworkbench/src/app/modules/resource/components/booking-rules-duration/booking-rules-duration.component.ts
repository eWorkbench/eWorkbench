/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Validators } from '@angular/forms';
import type { BookingRuleDuration, BookingRulePayload, DatePickerConfig } from '@eworkbench/types';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import flatpickr from 'flatpickr';
import { v4 as uuidv4 } from 'uuid';

interface RuleValues {
  days: number;
  duration: string;
}

@UntilDestroy()
@Component({
  selector: 'eworkbench-resource-booking-rules-duration',
  templateUrl: './booking-rules-duration.component.html',
  styleUrls: ['./booking-rules-duration.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResourceBookingRulesDurationComponent implements OnInit {
  @Input()
  public label?: string;

  @Input()
  public ruleKey!: string;

  @Input()
  public rule!: BookingRuleDuration | null;

  @Input()
  public editable? = false;

  @Input()
  public loading = false;

  @Input()
  public refresh?: EventEmitter<boolean>;

  @Output()
  public changed = new EventEmitter<BookingRulePayload>();

  @Output()
  public setChanged = new EventEmitter<boolean>();

  @Output()
  public remove = new EventEmitter<string>();

  public uuid = uuidv4();

  public datetimePickerConfig: DatePickerConfig = {
    dateFormat: 'H:i',
    enableTime: true,
    minuteIncrement: 1,
    noCalendar: true,
    time_24hr: true,
  };

  public form = this.fb.group({
    days: [0, [Validators.required]],
    duration: ['00:00', [Validators.required]],
  });

  public constructor(private readonly fb: FormBuilder) {}

  public get f() {
    return this.form.controls;
  }

  public ngOnInit(): void {
    this.refresh?.pipe(untilDestroyed(this)).subscribe(() => {
      this.pushChanges();
    });

    flatpickr(`#duration-${this.uuid}`, this.datetimePickerConfig);
    this.patchFormValues();
  }

  public patchFormValues(): void {
    const ruleValues = this.convertRuleToValues(this.rule?.duration);

    this.form.patchValue({
      days: ruleValues.days,
      duration: ruleValues.duration,
    });

    if (!this.editable) {
      this.f.days.disable();
      this.f.duration.disable();
    }
  }

  public convertRuleToValues(rule?: string | null): RuleValues {
    let days = 0;
    let duration = '00:00';

    if (rule) {
      const splitValues = rule.split(' ');

      if (splitValues.length > 1) {
        days = Number(splitValues[0]);
        duration = this.convertTimeToHoursMinutes(splitValues[1]);
      } else {
        days = 0;
        duration = this.convertTimeToHoursMinutes(splitValues[0]);
      }
    }

    return {
      days,
      duration,
    };
  }

  public convertTimeToHoursMinutes(time: string): string {
    return time.split(':').slice(0, -1).join(':');
  }

  public pushChanges(): void {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    const daysValue = this.f.days.value ?? 0;
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    const durationValue = this.f.duration.value ?? '00:00';
    const duration = `${daysValue} ${durationValue}:00`;

    this.changed.emit({
      id: this.rule!.id!,
      rule: this.ruleKey,
      values: {
        duration,
      },
    });
  }

  public onRemove(): void {
    this.remove.emit(this.ruleKey);
  }

  public onSetChanged(): void {
    this.setChanged.emit(true);
  }
}
