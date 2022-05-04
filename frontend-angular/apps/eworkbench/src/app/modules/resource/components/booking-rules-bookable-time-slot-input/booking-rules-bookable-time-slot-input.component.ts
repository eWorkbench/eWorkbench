/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import type { DatePickerConfig } from '@eworkbench/types';
import { FormGroup } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import flatpickr from 'flatpickr';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { filter, map, switchMap, tap } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';
import type { FormBookableTimeSlot } from '../../interfaces/form-bookable-time-slot';

@UntilDestroy()
@Component({
  selector: 'eworkbench-resource-booking-rules-bookable-time-slot-input',
  templateUrl: './booking-rules-bookable-time-slot-input.component.html',
  styleUrls: ['./booking-rules-bookable-time-slot-input.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResourceBookingRulesBookableTimeSlotInputComponent implements OnInit {
  @Input()
  public set formBookableTimeSlot(value: FormGroup<any>) {
    this.formGroupSubject$.next(value);
  }

  @Input()
  public loading = false;

  @Input()
  public editable? = false;

  @Output()
  public setChanged = new EventEmitter<boolean>();

  public timePickerConfig: DatePickerConfig = {
    dateFormat: 'H:i',
    enableTime: true,
    minuteIncrement: 1,
    noCalendar: true,
    time_24hr: true,
  };

  public uuid = uuidv4();

  public formGroupSubject$ = new BehaviorSubject<FormGroup<any> | null>(null);

  public readonly formGroup$ = this.formGroupSubject$.pipe(
    filter(Boolean),
    map(formGroup => formGroup as FormGroup<FormBookableTimeSlot>)
  );

  // @ts-expect-error
  // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
  public readonly weekdayUuid$ = this.formGroup$.pipe(map(formGroup => `${formGroup.controls.weekday.value}.${this.uuid}`));

  public readonly weekdayTranslationKey$ = this.formGroup$.pipe(
    // @ts-expect-error
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    map(formGroup => `weekDays.${formGroup.controls.weekdayTranslationKey.value}`)
  );

  public readonly isChecked$ = this.formGroup$.pipe(
    // @ts-expect-error
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    switchMap(formGroup => formGroup.controls.checked.value$),
    tap(checked => {
      if (!checked) {
        this.formGroupSubject$.value?.controls.fullDay.setValue(true);
      }
    })
  );

  public readonly fullDay$ = this.formGroup$.pipe(
    // @ts-expect-error
    switchMap(formGroup => formGroup.controls.fullDay.value$),
    tap(fullDay => {
      if (!fullDay) {
        this.initTimePickerConfig();
      }
    })
  );

  // @ts-expect-error
  // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
  public readonly timeStart$ = this.formGroup$.pipe(switchMap(formGroup => formGroup.controls.timeStart.value$));

  // @ts-expect-error
  // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
  public readonly timeEnd$ = this.formGroup$.pipe(switchMap(formGroup => formGroup.controls.timeEnd.value$));

  public readonly invalidTimeSelection$ = combineLatest([this.timeStart$, this.timeEnd$, this.fullDay$]).pipe(
    map(([timeStart, timeEnd, fullDay]) => {
      if (!this.editable) {
        return false;
      }

      if (fullDay) {
        return false;
      } else if (!timeStart || !timeEnd) {
        return true;
      }

      // @ts-expect-error
      const timeStartNumber = Number(timeStart.replace(':', ''));
      // @ts-expect-error
      const timeEndNumber = Number(timeEnd.replace(':', ''));

      return timeStartNumber >= timeEndNumber;
    }),
    tap(invalid => this.formGroupSubject$.value?.controls.invalidTimeSelection.setValue(invalid))
  );

  public ngOnInit(): void {
    this.initTimePickerConfig();

    this.formGroup$
      .pipe(
        untilDestroyed(this),
        switchMap(formGroup => formGroup.valueChanges)
      )
      .subscribe(() => this.setChanged.emit(true));
  }

  private initTimePickerConfig(): void {
    setTimeout(() => {
      flatpickr(`#timeStart${this.uuid}`, {
        ...this.timePickerConfig,
        defaultDate: this.formGroupSubject$.value?.controls.timeStart.value,
      });
      flatpickr(`#timeEnd${this.uuid}`, {
        ...this.timePickerConfig,
        defaultDate: this.formGroupSubject$.value?.controls.timeEnd.value,
      });
    }, 1);
  }
}
