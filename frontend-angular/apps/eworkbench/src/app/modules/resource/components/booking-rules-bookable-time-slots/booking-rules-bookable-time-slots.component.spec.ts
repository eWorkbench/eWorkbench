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
import { TooltipModule } from 'ngx-bootstrap/tooltip';
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
      TooltipModule.forRoot(),
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
    let time = spectator.component.convertRuleToValues('0 00:00:00');
    expect(time).toBe('00:00');

    time = spectator.component.convertRuleToValues('1 01:23:00');
    expect(time).toBe('01:23');

    time = spectator.component.convertRuleToValues('04:56:00');
    expect(time).toBe('04:56');

    time = spectator.component.convertRuleToValues(null);
    expect(time).toBe(null);
  });

  it('should push changes', () => {
    const pushChangesSpy = jest.spyOn(spectator.component, 'pushChanges');
    spectator.component.pushChanges();
    expect(pushChangesSpy).toHaveBeenCalledTimes(1);
  });

  it('should call onRemove()', () => {
    const onRemoveSpy = jest.spyOn(spectator.component, 'onRemove');
    spectator.component.onRemove();
    expect(onRemoveSpy).toHaveBeenCalledTimes(1);
  });

  it('should call onSetChanged()', () => {
    const onSetChangedSpy = jest.spyOn(spectator.component, 'onSetChanged');
    spectator.component.onSetChanged();
    expect(onSetChangedSpy).toHaveBeenCalledTimes(1);
  });

  it('should call showNoBookingRulesNotice()', () => {
    spectator.setInput({ editable: true });

    spectator.component.form.patchValue({});
    spectator.component.invalidDaySelection$.subscribe(invalidDaySelection => expect(invalidDaySelection).toBe(true));

    spectator.component.form.patchValue({
      monday: { checked: true },
      tuesday: { checked: false },
      wednesday: { checked: false },
      thursday: { checked: false },
      friday: { checked: false },
      saturday: { checked: false },
      sunday: { checked: false },
    });
    spectator.component.invalidDaySelection$.subscribe(invalidDaySelection => expect(invalidDaySelection).toBe(false));

    spectator.component.form.patchValue({
      monday: { checked: false },
      tuesday: { checked: true },
      wednesday: { checked: false },
      thursday: { checked: false },
      friday: { checked: false },
      saturday: { checked: false },
      sunday: { checked: false },
    });
    spectator.component.invalidDaySelection$.subscribe(invalidDaySelection => expect(invalidDaySelection).toBe(false));

    spectator.component.form.patchValue({
      monday: { checked: false },
      tuesday: { checked: false },
      wednesday: { checked: true },
      thursday: { checked: false },
      friday: { checked: false },
      saturday: { checked: false },
      sunday: { checked: false },
    });
    spectator.component.invalidDaySelection$.subscribe(invalidDaySelection => expect(invalidDaySelection).toBe(false));

    spectator.component.form.patchValue({
      monday: { checked: false },
      tuesday: { checked: false },
      wednesday: { checked: false },
      thursday: { checked: true },
      friday: { checked: false },
      saturday: { checked: false },
      sunday: { checked: false },
    });
    spectator.component.invalidDaySelection$.subscribe(invalidDaySelection => expect(invalidDaySelection).toBe(false));

    spectator.component.form.patchValue({
      monday: { checked: false },
      tuesday: { checked: false },
      wednesday: { checked: false },
      thursday: { checked: false },
      friday: { checked: true },
      saturday: { checked: false },
      sunday: { checked: false },
    });
    spectator.component.invalidDaySelection$.subscribe(invalidDaySelection => expect(invalidDaySelection).toBe(false));

    spectator.component.form.patchValue({
      monday: { checked: false },
      tuesday: { checked: false },
      wednesday: { checked: false },
      thursday: { checked: false },
      friday: { checked: false },
      saturday: { checked: true },
      sunday: { checked: false },
    });
    spectator.component.invalidDaySelection$.subscribe(invalidDaySelection => expect(invalidDaySelection).toBe(false));

    spectator.component.form.patchValue({
      monday: { checked: false },
      tuesday: { checked: false },
      wednesday: { checked: false },
      thursday: { checked: false },
      friday: { checked: false },
      saturday: { checked: false },
      sunday: { checked: true },
    });
    spectator.component.invalidDaySelection$.subscribe(invalidDaySelection => expect(invalidDaySelection).toBe(false));

    spectator.component.form.patchValue({
      monday: { checked: false },
      tuesday: { checked: false },
      wednesday: { checked: false },
      thursday: { checked: false },
      friday: { checked: false },
      saturday: { checked: false },
      sunday: { checked: false },
    });
    spectator.setInput({ editable: false });
    spectator.component.invalidDaySelection$.subscribe(invalidDaySelection => expect(invalidDaySelection).toBe(true));
  });
});
