/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import {
  BookingRuleBookableTimeSlots,
  BookingRuleBookingsPerUser,
  BookingRuleDuration,
  BookingRulePayload,
  BookingRulesPayload,
  DropdownElement,
  Resource,
} from '@eworkbench/types';
import { FormControl } from '@ngneat/reactive-forms';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ResourceBookingRulesBookingsPerUserComponent } from '../booking-rules-bookings-per-user/booking-rules-bookings-per-user.component';

@UntilDestroy()
@Component({
  selector: 'eworkbench-resource-booking-rules',
  templateUrl: './booking-rules.component.html',
  styleUrls: ['./booking-rules.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResourceBookingRulesComponent implements OnInit {
  @ViewChild('bookingRulesBookingsPerUser', { static: true })
  public bookingRulesBookingsPerUser?: ResourceBookingRulesBookingsPerUserComponent;

  @Input()
  public bookableTimeSlots?: BookingRuleBookableTimeSlots[];

  @Input()
  public bookingsPerUser?: BookingRuleBookingsPerUser[];

  @Input()
  public minimumDuration?: BookingRuleDuration | null;

  @Input()
  public maximumDuration?: BookingRuleDuration | null;

  @Input()
  public minimumTimeBefore?: BookingRuleDuration | null;

  @Input()
  public maximumTimeBefore?: BookingRuleDuration | null;

  @Input()
  public timeBetween?: BookingRuleDuration | null;

  @Input()
  public loading = false;

  @Input()
  public editable? = false;

  @Input()
  public refresh?: EventEmitter<boolean>;

  @Input()
  public onSubmit?: EventEmitter<Resource>;

  @Output()
  public changed = new EventEmitter<BookingRulesPayload>();

  public refreshBookingRules = new EventEmitter<boolean>();

  public rules: DropdownElement[] = [];

  public rulesFormControl = new FormControl();

  public bookingRules: BookingRulesPayload = {
    booking_rule_bookable_hours: [],
    booking_rule_bookings_per_user: [],
    booking_rule_minimum_duration: null,
    booking_rule_maximum_duration: null,
    booking_rule_minimum_time_before: null,
    booking_rule_maximum_time_before: null,
    booking_rule_time_between: null,
  };

  public initialState: BookingRulesPayload = {
    booking_rule_bookable_hours: [],
    booking_rule_bookings_per_user: [],
    booking_rule_minimum_duration: null,
    booking_rule_maximum_duration: null,
    booking_rule_minimum_time_before: null,
    booking_rule_maximum_time_before: null,
    booking_rule_time_between: null,
  };

  private hasChanged = false;

  public constructor(private readonly cdr: ChangeDetectorRef, private readonly translocoService: TranslocoService) {}

  public ngOnInit(): void {
    this.setInitialState();
    this.updateRulesSelection();

    /* istanbul ignore next */
    this.refresh?.pipe(untilDestroyed(this)).subscribe(() => {
      this.bookingRules = {
        booking_rule_bookable_hours: [],
        booking_rule_bookings_per_user: [],
        booking_rule_minimum_duration: null,
        booking_rule_maximum_duration: null,
        booking_rule_minimum_time_before: null,
        booking_rule_maximum_time_before: null,
        booking_rule_time_between: null,
      };

      this.refreshBookingRules.next(true);
    });

    /* istanbul ignore next */
    this.onSubmit?.pipe(untilDestroyed(this)).subscribe(resource => {
      this.setInitialState(resource);
      this.reinitializeBookingRules();
    });
  }

  public setInitialState(resource?: Resource): void {
    this.initialState = {
      booking_rule_bookable_hours: resource?.booking_rule_bookable_hours ?? this.bookableTimeSlots ?? [],
      booking_rule_bookings_per_user: resource?.booking_rule_bookings_per_user ?? this.bookingsPerUser ?? [],
      booking_rule_minimum_duration: resource?.booking_rule_minimum_duration ?? this.minimumDuration ?? null,
      booking_rule_maximum_duration: resource?.booking_rule_maximum_duration ?? this.maximumDuration ?? null,
      booking_rule_minimum_time_before: resource?.booking_rule_minimum_time_before ?? this.minimumTimeBefore ?? null,
      booking_rule_maximum_time_before: resource?.booking_rule_maximum_time_before ?? this.maximumTimeBefore ?? null,
      booking_rule_time_between: resource?.booking_rule_time_between ?? this.timeBetween ?? null,
    };
  }

  public onChanged(bookingRule: BookingRulePayload): void {
    const rule = bookingRule.rule;

    if (rule === 'booking_rule_bookable_hours') {
      this.bookingRules.booking_rule_bookable_hours = bookingRule.values as BookingRuleBookableTimeSlots[];
    } else if (rule === 'booking_rule_bookings_per_user') {
      this.bookingRules.booking_rule_bookings_per_user = bookingRule.values as BookingRuleBookingsPerUser[];
    } else if (rule === 'booking_rule_minimum_duration') {
      this.bookingRules.booking_rule_minimum_duration = {
        id: bookingRule.id!,
        duration: (bookingRule.values as BookingRuleDuration).duration,
      };
    } else if (rule === 'booking_rule_maximum_duration') {
      this.bookingRules.booking_rule_maximum_duration = {
        id: bookingRule.id!,
        duration: (bookingRule.values as BookingRuleDuration).duration,
      };
    } else if (rule === 'booking_rule_minimum_time_before') {
      this.bookingRules.booking_rule_minimum_time_before = {
        id: bookingRule.id!,
        duration: (bookingRule.values as BookingRuleDuration).duration,
      };
    } else if (rule === 'booking_rule_maximum_time_before') {
      this.bookingRules.booking_rule_maximum_time_before = {
        id: bookingRule.id!,
        duration: (bookingRule.values as BookingRuleDuration).duration,
      };
    } else if (rule === 'booking_rule_time_between') {
      this.bookingRules.booking_rule_time_between = {
        id: bookingRule.id!,
        duration: (bookingRule.values as BookingRuleDuration).duration,
      };
    }

    this.changed.emit(this.getBookingRules());
    this.updateRulesSelection();
  }

  public getBookingRules(): BookingRulesPayload {
    return this.bookingRules;
  }

  public onAdd(): void {
    const rule = this.rulesFormControl.value;

    if (rule === 'booking_rule_bookable_hours') {
      this.bookableTimeSlots = [
        {
          weekday: 'MON',
          full_day: true,
          time_start: null,
          time_end: null,
        },
        {
          weekday: 'TUE',
          full_day: true,
          time_start: null,
          time_end: null,
        },
        {
          weekday: 'WED',
          full_day: true,
          time_start: null,
          time_end: null,
        },
        {
          weekday: 'THU',
          full_day: true,
          time_start: null,
          time_end: null,
        },
        {
          weekday: 'FRI',
          full_day: true,
          time_start: null,
          time_end: null,
        },
        {
          weekday: 'SAT',
          full_day: true,
          time_start: null,
          time_end: null,
        },
        {
          weekday: 'SUN',
          full_day: true,
          time_start: null,
          time_end: null,
        },
      ];
    } else if (rule === 'booking_rule_minimum_duration') {
      this.minimumDuration = {
        duration: '0 00:00:00',
      };
    } else if (rule === 'booking_rule_maximum_duration') {
      this.maximumDuration = {
        duration: '0 00:00:00',
      };
    } else if (rule === 'booking_rule_minimum_time_before') {
      this.minimumTimeBefore = {
        duration: '0 00:00:00',
      };
    } else if (rule === 'booking_rule_maximum_time_before') {
      this.maximumTimeBefore = {
        duration: '0 00:00:00',
      };
    } else if (rule === 'booking_rule_time_between') {
      this.timeBetween = {
        duration: '0 00:00:00',
      };
    } else if (rule === 'booking_rule_bookings_per_user') {
      this.bookingsPerUser = [
        {
          count: 1,
          unit: 'DAY',
        },
      ];
    }

    this.rulesFormControl.patchValue(null);
    this.updateRulesSelection();
    this.cdr.markForCheck();
  }

  public updateRulesSelection(): void {
    const rules: DropdownElement[] = [];

    if (!this.bookableTimeSlots?.length) {
      rules.push({
        value: 'booking_rule_bookable_hours',
        label: this.translocoService.translate('resources.bookingRules.bookableTimeSlots.label'),
      });
    }

    if (!this.bookingsPerUser?.length) {
      rules.push({
        value: 'booking_rule_bookings_per_user',
        label: this.translocoService.translate('resources.bookingRules.bookingsPerUser.label'),
      });
    }

    if (!this.minimumDuration) {
      rules.push({
        value: 'booking_rule_minimum_duration',
        label: this.translocoService.translate('resources.bookingRules.minimumDuration.label'),
      });
    }

    if (!this.maximumDuration) {
      rules.push({
        value: 'booking_rule_maximum_duration',
        label: this.translocoService.translate('resources.bookingRules.maximumDuration.label'),
      });
    }

    if (!this.minimumTimeBefore) {
      rules.push({
        value: 'booking_rule_minimum_time_before',
        label: this.translocoService.translate('resources.bookingRules.minimumTimeBefore.label'),
      });
    }

    if (!this.maximumTimeBefore) {
      rules.push({
        value: 'booking_rule_maximum_time_before',
        label: this.translocoService.translate('resources.bookingRules.maximumTimeBefore.label'),
      });
    }

    if (!this.timeBetween) {
      rules.push({
        value: 'booking_rule_time_between',
        label: this.translocoService.translate('resources.bookingRules.timeBetween.label'),
      });
    }

    this.rules = rules;
  }

  public showButtons(): boolean {
    return this.hasChanged;
  }

  public onRemove(rule: string): void {
    if (rule === 'booking_rule_bookable_hours') {
      this.bookableTimeSlots = [];
    } else if (rule === 'booking_rule_minimum_duration') {
      this.minimumDuration = null;
    } else if (rule === 'booking_rule_maximum_duration') {
      this.maximumDuration = null;
    } else if (rule === 'booking_rule_minimum_time_before') {
      this.minimumTimeBefore = null;
    } else if (rule === 'booking_rule_maximum_time_before') {
      this.maximumTimeBefore = null;
    } else if (rule === 'booking_rule_time_between') {
      this.timeBetween = null;
    } else if (rule === 'booking_rule_bookings_per_user') {
      this.bookingsPerUser = [];
    }

    this.updateRulesSelection();
    this.hasChanged = true;
  }

  public onCancel(): void {
    this.reinitializeBookingRules();
  }

  public onSetChanged(): void {
    this.hasChanged = true;
  }

  public reinitializeBookingRules(): void {
    this.bookableTimeSlots = undefined!;
    this.bookingsPerUser = undefined!;
    this.minimumDuration = undefined!;
    this.maximumDuration = undefined!;
    this.minimumTimeBefore = undefined!;
    this.maximumTimeBefore = undefined!;
    this.timeBetween = undefined!;

    this.cdr.detectChanges();

    this.bookableTimeSlots = this.initialState.booking_rule_bookable_hours;
    this.bookingsPerUser = this.initialState.booking_rule_bookings_per_user;
    this.minimumDuration = this.initialState.booking_rule_minimum_duration;
    this.maximumDuration = this.initialState.booking_rule_maximum_duration;
    this.minimumTimeBefore = this.initialState.booking_rule_minimum_time_before;
    this.maximumTimeBefore = this.initialState.booking_rule_maximum_time_before;
    this.timeBetween = this.initialState.booking_rule_time_between;

    this.updateRulesSelection();

    this.hasChanged = false;

    this.cdr.markForCheck();
  }

  public showNoBookingRulesNotice(): boolean {
    return (
      !this.bookableTimeSlots?.length &&
      !this.bookingsPerUser?.length &&
      !this.minimumDuration &&
      !this.maximumDuration &&
      !this.minimumTimeBefore &&
      !this.maximumTimeBefore &&
      !this.timeBetween
    );
  }
}
