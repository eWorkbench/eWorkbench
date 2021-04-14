/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, ChangeDetectionStrategy, Input, EventEmitter, Output, OnInit, ViewChildren, QueryList } from '@angular/core';
import { BookingRuleBookingsPerUser, BookingRulePayload } from '@eworkbench/types';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { v4 as uuidv4 } from 'uuid';
import { ResourceBookingRulesBookingsPerUserElementComponent } from '../booking-rules-bookings-per-user-element/booking-rules-bookings-per-user-element.component';

@UntilDestroy()
@Component({
  selector: 'eworkbench-resource-booking-rules-bookings-per-user',
  templateUrl: './booking-rules-bookings-per-user.component.html',
  styleUrls: ['./booking-rules-bookings-per-user.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResourceBookingRulesBookingsPerUserComponent implements OnInit {
  @ViewChildren(ResourceBookingRulesBookingsPerUserElementComponent)
  public elements?: QueryList<ResourceBookingRulesBookingsPerUserElementComponent>;

  @Input()
  public rule!: BookingRuleBookingsPerUser[];

  @Input()
  public editable = false;

  @Input()
  public loading = false;

  @Input()
  public refreshBookingRules?: EventEmitter<boolean>;

  @Output()
  public changed = new EventEmitter<BookingRulePayload>();

  @Output()
  public setChanged = new EventEmitter<boolean>();

  @Output()
  public remove = new EventEmitter<string>();

  public ruleKey = 'booking_rule_bookings_per_user';

  private rules: BookingRuleBookingsPerUser[] = [];

  public ngOnInit(): void {
    /* istanbul ignore next */
    this.refreshBookingRules?.pipe(untilDestroyed(this)).subscribe(() => {
      this.rules = [];

      this.changed.emit({
        rule: this.ruleKey,
        values: this.rules,
      });
    });
  }

  public pushChanges(bookingRule: BookingRulePayload): void {
    const values = bookingRule.values as BookingRuleBookingsPerUser;

    this.rules.push({
      id: bookingRule.id,
      uuid: bookingRule.uuid,
      count: values.count,
      unit: values.unit,
    });

    this.changed.emit({
      rule: this.ruleKey,
      values: this.rules,
    });
  }

  public getUnitChoice(): 'DAY' | 'WEEK' | 'MONTH' | null {
    const ruleUnits: string[] = [];
    this.rule.map(rule => {
      if (rule.unit !== null) {
        ruleUnits.push(rule.unit);
      }
    });

    if (!ruleUnits.includes('DAY')) {
      return 'DAY';
    } else if (!ruleUnits.includes('WEEK')) {
      return 'WEEK';
    } else if (!ruleUnits.includes('MONTH')) {
      return 'MONTH';
    }

    return null;
  }

  public onAdd(): void {
    if (this.rule.length < 3) {
      this.rule = [
        ...this.rule,
        {
          uuid: uuidv4(),
          count: 1,
          unit: this.getUnitChoice(),
        },
      ];

      this.onSetChanged();
    }
  }

  public onRemove(bookingRule: BookingRuleBookingsPerUser): void {
    const newRule: BookingRuleBookingsPerUser[] = [];

    this.rule.map(rule => {
      if ((rule.uuid && rule.uuid !== bookingRule.uuid) || rule.id !== bookingRule.id) {
        newRule.push(rule);
      }
    });

    this.rule = newRule;

    if (this.rule.length === 0) {
      this.remove.emit(this.ruleKey);
    }
  }

  public onSetChanged(): void {
    this.setChanged.emit();
  }

  public getSelectedUnitsOfChildElements(): (string | null)[] {
    const units: (string | null)[] = [];

    this.elements?.forEach(element => {
      units.push(element.f.unit.value);
    });

    return units;
  }

  public unitSelectionInvalid(): boolean {
    const units = this.getSelectedUnitsOfChildElements();
    return new Set(units).size !== units.length;
  }
}
