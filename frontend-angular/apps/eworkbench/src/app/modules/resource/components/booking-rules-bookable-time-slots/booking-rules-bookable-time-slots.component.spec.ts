/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { FormHelperModule } from '@app/modules/form-helper/form-helper.module';
import { ResourceModule } from '@app/modules/resource/resource.module';
import { SharedModule } from '@app/modules/shared/shared.module';
import { TrashModule } from '@app/modules/trash/trash.module';
import { UserModule } from '@app/modules/user/user.module';
import { getTranslocoModule } from '@app/transloco-testing.module';
import { FormsModule } from '@eworkbench/forms';
import { mockBookingRuleTimeSlots } from '@eworkbench/mocks';
import { ModalsModule } from '@eworkbench/modals';
import { TableModule } from '@eworkbench/table';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { ResourceBookingRulesBookableTimeSlotsComponent } from './booking-rules-bookable-time-slots.component';

describe('ResourceBookingRulesBookableTimeSlotsComponent', () => {
  let spectator: Spectator<ResourceBookingRulesBookableTimeSlotsComponent>;
  const createComponent = createComponentFactory({
    component: ResourceBookingRulesBookableTimeSlotsComponent,
    imports: [
      HttpClientTestingModule,
      FormsModule,
      getTranslocoModule(),
      FormHelperModule,
      TableModule,
      UserModule,
      RouterTestingModule,
      SharedModule,
      TrashModule,
      ResourceModule,
      ModalsModule,
    ],
  });

  beforeEach(
    () =>
      (spectator = createComponent({
        props: {
          rule: mockBookingRuleTimeSlots,
        },
      }))
  );

  it('should create', () => {
    expect(spectator).toBeTruthy();
  });

  it('should convert rule to values', () => {
    let ruleValues = spectator.component.convertRuleToValues('0 00:00:00');
    expect(ruleValues.days).toBe(0);
    expect(ruleValues.duration).toBe('00:00');

    ruleValues = spectator.component.convertRuleToValues('1 01:23:00');
    expect(ruleValues.days).toBe(1);
    expect(ruleValues.duration).toBe('01:23');

    ruleValues = spectator.component.convertRuleToValues('04:56:00');
    expect(ruleValues.days).toBe(0);
    expect(ruleValues.duration).toBe('04:56');

    ruleValues = spectator.component.convertRuleToValues(null);
    expect(ruleValues.days).toBe(0);
    expect(ruleValues.duration).toBe('00:00');
  });

  it('should push changes', () => {
    const pushChangesSpy = spyOn(spectator.component, 'pushChanges').and.callThrough();
    spectator.component.pushChanges();
    expect(pushChangesSpy).toHaveBeenCalledTimes(1);
  });

  it('should call patchFormValues()', () => {
    const patchFormValuesSpy = spyOn(spectator.component, 'patchFormValues').and.callThrough();
    spectator.component.patchFormValues();
    expect(patchFormValuesSpy).toHaveBeenCalledTimes(1);

    spectator.setInput({ rule: null });
    spectator.component.patchFormValues();
    expect(patchFormValuesSpy).toHaveBeenCalledTimes(2);
  });

  it('should call onRemove()', () => {
    const onRemoveSpy = spyOn(spectator.component, 'onRemove').and.callThrough();
    spectator.component.onRemove();
    expect(onRemoveSpy).toHaveBeenCalledTimes(1);
  });

  it('should call onSetChanged()', () => {
    const onSetChangedSpy = spyOn(spectator.component, 'onSetChanged').and.callThrough();
    spectator.component.onSetChanged();
    expect(onSetChangedSpy).toHaveBeenCalledTimes(1);
  });

  it('should call showNoBookingRulesNotice()', () => {
    spectator.setInput({ editable: true });

    spectator.component.form.patchValue({
      monday: false,
      tuesday: false,
      wednesday: false,
      thursday: false,
      friday: false,
      saturday: false,
      sunday: false,
    });
    expect(spectator.component.daySelectionInvalid()).toBe(true);

    spectator.component.form.patchValue({
      monday: true,
      tuesday: false,
      wednesday: false,
      thursday: false,
      friday: false,
      saturday: false,
      sunday: false,
    });
    expect(spectator.component.daySelectionInvalid()).toBe(false);

    spectator.component.form.patchValue({
      monday: false,
      tuesday: true,
      wednesday: false,
      thursday: false,
      friday: false,
      saturday: false,
      sunday: false,
    });
    expect(spectator.component.daySelectionInvalid()).toBe(false);

    spectator.component.form.patchValue({
      monday: false,
      tuesday: false,
      wednesday: true,
      thursday: false,
      friday: false,
      saturday: false,
      sunday: false,
    });
    expect(spectator.component.daySelectionInvalid()).toBe(false);

    spectator.component.form.patchValue({
      monday: false,
      tuesday: false,
      wednesday: false,
      thursday: true,
      friday: false,
      saturday: false,
      sunday: false,
    });
    expect(spectator.component.daySelectionInvalid()).toBe(false);

    spectator.component.form.patchValue({
      monday: false,
      tuesday: false,
      wednesday: false,
      thursday: false,
      friday: true,
      saturday: false,
      sunday: false,
    });
    expect(spectator.component.daySelectionInvalid()).toBe(false);

    spectator.component.form.patchValue({
      monday: false,
      tuesday: false,
      wednesday: false,
      thursday: false,
      friday: false,
      saturday: true,
      sunday: false,
    });
    expect(spectator.component.daySelectionInvalid()).toBe(false);

    spectator.component.form.patchValue({
      monday: false,
      tuesday: false,
      wednesday: false,
      thursday: false,
      friday: false,
      saturday: false,
      sunday: true,
    });
    expect(spectator.component.daySelectionInvalid()).toBe(false);

    spectator.component.form.patchValue({
      monday: false,
      tuesday: false,
      wednesday: false,
      thursday: false,
      friday: false,
      saturday: false,
      sunday: false,
    });
    spectator.setInput({ editable: false });
    expect(spectator.component.daySelectionInvalid()).toBe(false);
  });
});
