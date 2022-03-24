/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { BookingRuleBookableTimeSlots, BookingRulePayload } from '@eworkbench/types';
import { FormBuilder, FormControl, FormGroup } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';
import { FormBookableTimeSlot } from '../../interfaces/form-bookable-time-slot';
import { FormBookableTimeSlots } from '../../interfaces/form-bookable-time-slots';

@UntilDestroy()
@Component({
  selector: 'eworkbench-resource-booking-rules-bookable-time-slots',
  templateUrl: './booking-rules-bookable-time-slots.component.html',
  styleUrls: ['./booking-rules-bookable-time-slots.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResourceBookingRulesBookableTimeSlotsComponent implements OnInit {
  @Input()
  public rule!: BookingRuleBookableTimeSlots[];

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

  public ruleKey = 'booking_rule_bookable_hours';

  public weekdays = {
    MON: 'monday',
    TUE: 'tuesday',
    WED: 'wednesday',
    THU: 'thursday',
    FRI: 'friday',
    SAT: 'saturday',
    SUN: 'sunday',
  };

  public uuid = uuidv4();

  public form!: FormGroup<FormBookableTimeSlots>;

  public monday!: FormGroup<FormBookableTimeSlot>;
  public tuesday!: FormGroup<FormBookableTimeSlot>;
  public wednesday!: FormGroup<FormBookableTimeSlot>;
  public thursday!: FormGroup<FormBookableTimeSlot>;
  public friday!: FormGroup<FormBookableTimeSlot>;
  public saturday!: FormGroup<FormBookableTimeSlot>;
  public sunday!: FormGroup<FormBookableTimeSlot>;

  public invalidDaySelection$!: Observable<boolean>;

  public invalidTimeSelection$!: Observable<boolean>;

  public constructor(private readonly fb: FormBuilder, private readonly cdr: ChangeDetectorRef) {}

  public get f(): FormGroup<FormBookableTimeSlots>['controls'] {
    /* istanbul ignore next */
    return this.form.controls;
  }

  public ngOnInit(): void {
    /* istanbul ignore next */
    this.refresh?.pipe(untilDestroyed(this)).subscribe(() => {
      this.pushChanges();
    });

    this.monday = this.createTimeSlotFormGroup('MON', 'monday');
    this.tuesday = this.createTimeSlotFormGroup('TUE', 'tuesday');
    this.wednesday = this.createTimeSlotFormGroup('WED', 'wednesday');
    this.thursday = this.createTimeSlotFormGroup('THU', 'thursday');
    this.friday = this.createTimeSlotFormGroup('FRI', 'friday');
    this.saturday = this.createTimeSlotFormGroup('SAT', 'saturday');
    this.sunday = this.createTimeSlotFormGroup('SUN', 'sunday');
    this.form = new FormGroup<FormBookableTimeSlots>({
      monday: this.monday,
      tuesday: this.tuesday,
      wednesday: this.wednesday,
      thursday: this.thursday,
      friday: this.friday,
      saturday: this.saturday,
      sunday: this.sunday,
    });

    this.invalidDaySelection$ = this.form.value$.pipe(
      map(
        form =>
          !Boolean(
            form.monday.checked ||
              form.tuesday.checked ||
              form.wednesday.checked ||
              form.thursday.checked ||
              form.friday.checked ||
              form.saturday.checked ||
              form.sunday.checked
          )
      )
    );

    this.invalidTimeSelection$ = this.form.value$.pipe(
      map(form =>
        Boolean(
          form.monday.invalidTimeSelection ||
            form.tuesday.invalidTimeSelection ||
            form.wednesday.invalidTimeSelection ||
            form.thursday.invalidTimeSelection ||
            form.friday.invalidTimeSelection ||
            form.saturday.invalidTimeSelection ||
            form.sunday.invalidTimeSelection
        )
      ),
      tap(() => setTimeout(() => this.cdr.detectChanges(), 100))
    );
  }

  public getExistingRule(weekday: string): BookingRuleBookableTimeSlots | undefined {
    return this.rule.filter(element => element.weekday === weekday)[0];
  }

  public createTimeSlotFormGroup(weekday: string, translationKey: string): FormGroup<FormBookableTimeSlot> {
    const existingRule = this.getExistingRule(weekday);
    const timeStart = this.convertRuleToValues(existingRule?.time_start);
    const timeEnd = this.convertRuleToValues(existingRule?.time_end);
    return new FormGroup<FormBookableTimeSlot>({
      checked: new FormControl(existingRule ? true : false),
      weekday: new FormControl(weekday),
      weekdayTranslationKey: new FormControl(translationKey),
      fullDay: new FormControl(existingRule?.full_day ?? true),
      timeStart: new FormControl(timeStart),
      timeEnd: new FormControl(timeEnd),
      invalidTimeSelection: new FormControl(false),
    });
  }

  public convertRuleToValues(rule?: string | null): string | null {
    let duration = null;

    if (rule) {
      const splitValues = rule.split(' ');

      if (splitValues.length > 1) {
        duration = this.convertTimeToHoursMinutes(splitValues[1]);
      } else {
        duration = this.convertTimeToHoursMinutes(splitValues[0]);
      }
    }

    return duration;
  }

  public convertTimeToHoursMinutes(time: string): string {
    return time.split(':').slice(0, -1).join(':');
  }

  public pushChanges(): void {
    const values: BookingRuleBookableTimeSlots[] = [];

    this.addTimeSlot(values, 'monday');
    this.addTimeSlot(values, 'tuesday');
    this.addTimeSlot(values, 'wednesday');
    this.addTimeSlot(values, 'thursday');
    this.addTimeSlot(values, 'friday');
    this.addTimeSlot(values, 'saturday');
    this.addTimeSlot(values, 'sunday');

    this.changed.emit({
      rule: this.ruleKey,
      values,
    });
  }

  public addTimeSlot(values: BookingRuleBookableTimeSlots[], controlKey: string): void {
    const formBookableTimeSlot = this.form.getControl(controlKey).value as FormBookableTimeSlot;

    if (formBookableTimeSlot.timeStart === '') {
      formBookableTimeSlot.timeStart = null;
    }

    if (formBookableTimeSlot.timeEnd === '') {
      formBookableTimeSlot.timeEnd = null;
    }

    if (formBookableTimeSlot.checked) {
      values.push({
        full_day: formBookableTimeSlot.fullDay,
        weekday: formBookableTimeSlot.weekday,
        time_start: formBookableTimeSlot.fullDay ? '00:00:00' : formBookableTimeSlot.timeStart,
        time_end: formBookableTimeSlot.fullDay ? '23:59:59' : formBookableTimeSlot.timeEnd,
      });
    }
  }

  public onRemove(): void {
    this.form.reset();
    this.remove.emit(this.ruleKey);
  }

  public onSetChanged(): void {
    this.setChanged.emit(true);
  }
}
