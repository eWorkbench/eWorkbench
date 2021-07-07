/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Validators } from '@angular/forms';
import { BookingRuleBookingsPerUser, BookingRulePayload, DropdownElement } from '@eworkbench/types';
import { FormBuilder, FormGroup } from '@ngneat/reactive-forms';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { v4 as uuidv4 } from 'uuid';

interface FormBooking {
  count: number | null;
  unit: 'DAY' | 'WEEK' | 'MONTH' | null;
}

@UntilDestroy()
@Component({
  selector: 'eworkbench-resource-booking-rules-bookings-per-user-element',
  templateUrl: './booking-rules-bookings-per-user-element.component.html',
  styleUrls: ['./booking-rules-bookings-per-user-element.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResourceBookingRulesBookingsPerUserElementComponent implements OnInit {
  @Input()
  public rule!: BookingRuleBookingsPerUser;

  @Input()
  public loading = false;

  @Input()
  public editable = false;

  @Input()
  public refresh?: EventEmitter<boolean>;

  @Input()
  public unitSelectionInvalid = false;

  @Output()
  public changed = new EventEmitter<BookingRulePayload>();

  @Output()
  public setChanged = new EventEmitter<boolean>();

  @Output()
  public remove = new EventEmitter<BookingRuleBookingsPerUser>();

  public ruleKey = 'booking_rule_bookings_per_user';

  public uuid = uuidv4();

  public deleted = false;

  public units: DropdownElement[] = [];

  public form = this.fb.group<FormBooking>({
    count: [null, [Validators.required]],
    unit: [null, [Validators.required]],
  });

  public constructor(private readonly fb: FormBuilder, private readonly translocoService: TranslocoService) {}

  public get f(): FormGroup<FormBooking>['controls'] {
    /* istanbul ignore next */
    return this.form.controls;
  }

  public ngOnInit(): void {
    /* istanbul ignore next */
    this.refresh?.pipe(untilDestroyed(this)).subscribe(() => {
      this.pushChanges();
    });

    this.initTranslations();
    this.patchFormValues();
  }

  public initTranslations(): void {
    this.translocoService
      .selectTranslateObject('resources.bookingRules.bookingsPerUser.units')
      .pipe(untilDestroyed(this))
      .subscribe(units => {
        this.units = [
          {
            value: 'DAY',
            label: units.day,
          },
          {
            value: 'WEEK',
            label: units.week,
          },
          {
            value: 'MONTH',
            label: units.month,
          },
        ];
      });
  }

  public patchFormValues(): void {
    this.form.patchValue({
      count: this.rule.count,
      unit: this.rule.unit,
    });

    if (!this.editable) {
      this.f.count.disable();
      this.f.unit.disable();
    }
  }

  public pushChanges(): void {
    this.changed.emit({
      id: this.rule.id!,
      uuid: this.rule.uuid!,
      rule: this.ruleKey,
      values: {
        count: this.f.count.value,
        unit: this.f.unit.value,
      },
    });
  }

  public onRemove(): void {
    this.remove.emit(this.rule);
    this.onSetChanged();
  }

  public onSetChanged(): void {
    this.setChanged.emit(true);
  }
}
