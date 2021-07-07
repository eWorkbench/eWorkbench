/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { AfterViewInit, ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Validators } from '@angular/forms';
import { BookingRuleBookableTimeSlots, BookingRulePayload, DatePickerConfig } from '@eworkbench/types';
import { FormBuilder, FormGroup } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { v4 as uuidv4 } from 'uuid';
import flatpickr from 'flatpickr';

interface FormBookableTimeSlots {
  monday: boolean;
  tuesday: boolean;
  wednesday: boolean;
  thursday: boolean;
  friday: boolean;
  saturday: boolean;
  sunday: boolean;
  fullDay: boolean;
  timeStart: string | null;
  timeEnd: string | null;
}

interface RuleValues {
  days: number;
  duration: string;
}

@UntilDestroy()
@Component({
  selector: 'eworkbench-resource-booking-rules-bookable-time-slots',
  templateUrl: './booking-rules-bookable-time-slots.component.html',
  styleUrls: ['./booking-rules-bookable-time-slots.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResourceBookingRulesBookableTimeSlotsComponent implements OnInit, AfterViewInit {
  @Input()
  public rule!: BookingRuleBookableTimeSlots | null;

  @Input()
  public editable = false;

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

  public ruleKey = 'booking_rule_bookable_hours';

  public uuid = uuidv4();

  public timePickerConfig: DatePickerConfig = {
    dateFormat: 'H:i',
    enableTime: true,
    minuteIncrement: 1,
    noCalendar: true,
    time_24hr: true,
  };

  public form = this.fb.group<FormBookableTimeSlots>({
    monday: [false],
    tuesday: [false],
    wednesday: [false],
    thursday: [false],
    friday: [false],
    saturday: [false],
    sunday: [false],
    fullDay: [true],
    timeStart: ['08:00', [Validators.required]],
    timeEnd: ['10:00', [Validators.required]],
  });

  public constructor(private readonly fb: FormBuilder) {}

  public get f(): FormGroup<FormBookableTimeSlots>['controls'] {
    /* istanbul ignore next */
    return this.form.controls;
  }

  public ngOnInit(): void {
    this.patchFormValues();

    /* istanbul ignore next */
    this.refresh?.pipe(untilDestroyed(this)).subscribe(() => {
      this.pushChanges();
    });
  }

  public ngAfterViewInit(): void {
    const timeStartValues = this.convertRuleToValues(this.rule?.time_start);
    const timeEndValues = this.convertRuleToValues(this.rule?.time_end);

    flatpickr(`#timeStart${this.uuid}`, {
      ...this.timePickerConfig,
      defaultDate: timeStartValues.duration,
    });
    flatpickr(`#timeEnd${this.uuid}`, {
      ...this.timePickerConfig,
      defaultDate: timeEndValues.duration,
    });
  }

  public patchFormValues(): void {
    const timeStartValues = this.convertRuleToValues(this.rule?.time_start);
    const timeEndValues = this.convertRuleToValues(this.rule?.time_end);

    this.form.patchValue({
      monday: this.rule?.monday ?? false,
      tuesday: this.rule?.tuesday ?? false,
      wednesday: this.rule?.wednesday ?? false,
      thursday: this.rule?.thursday ?? false,
      friday: this.rule?.friday ?? false,
      saturday: this.rule?.saturday ?? false,
      sunday: this.rule?.sunday ?? false,
      fullDay: this.rule?.full_day ?? true,
      timeStart: timeStartValues.duration,
      timeEnd: timeEndValues.duration,
    });

    if (!this.editable) {
      this.f.monday.disable();
      this.f.tuesday.disable();
      this.f.wednesday.disable();
      this.f.thursday.disable();
      this.f.friday.disable();
      this.f.saturday.disable();
      this.f.sunday.disable();
      this.f.fullDay.disable();
      this.f.timeStart.disable();
      this.f.timeEnd.disable();
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
    const fullDay = this.f.fullDay.value;
    const timeStart = this.f.timeStart.value ?? '00:00';
    const timeEnd = this.f.timeEnd.value ?? '00:00';

    this.changed.emit({
      id: this.rule!.id!,
      rule: this.ruleKey,
      values: {
        monday: this.f.monday.value,
        tuesday: this.f.tuesday.value,
        wednesday: this.f.wednesday.value,
        thursday: this.f.thursday.value,
        friday: this.f.friday.value,
        saturday: this.f.saturday.value,
        sunday: this.f.sunday.value,
        full_day: this.f.fullDay.value,
        time_start: fullDay ? '00:00:00' : `${timeStart}:00`,
        time_end: fullDay ? '23:59:59' : `${timeEnd}:00`,
      },
    });
  }

  public onRemove(): void {
    this.remove.emit(this.ruleKey);
  }

  public onSetChanged(): void {
    this.setChanged.emit(true);
  }

  public daySelectionInvalid(): boolean {
    return (
      !this.f.monday.value &&
      !this.f.tuesday.value &&
      !this.f.wednesday.value &&
      !this.f.thursday.value &&
      !this.f.friday.value &&
      !this.f.saturday.value &&
      !this.f.sunday.value &&
      this.editable
    );
  }

  public timeSelectionInvalid(): boolean {
    if (!this.editable) {
      return false;
    }

    const fullDay = this.f.fullDay.value;
    const timeStart = this.f.timeStart.value;
    const timeEnd = this.f.timeEnd.value;

    if (fullDay) {
      return false;
    } else if (!timeStart || !timeEnd) {
      return true;
    }

    const timeStartNumber = Number(timeStart.replace(':', ''));
    const timeEndNumber = Number(timeEnd.replace(':', ''));

    return timeStartNumber >= timeEndNumber;
  }
}
