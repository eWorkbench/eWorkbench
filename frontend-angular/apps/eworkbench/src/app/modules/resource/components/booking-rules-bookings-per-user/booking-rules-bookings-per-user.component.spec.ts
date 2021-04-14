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
import { IconsModule } from '@eworkbench/icons';
import {
  mockBookingRuleBookingsPerUser,
  mockBookingRuleBookingsPerUserPayload,
  mockBookingRulePerUserDay,
  mockBookingRulePerUserWeek,
} from '@eworkbench/mocks';
import { ModalsModule } from '@eworkbench/modals';
import { TableModule } from '@eworkbench/table';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { ResourceBookingRulesBookingsPerUserComponent } from './booking-rules-bookings-per-user.component';

describe('ResourceBookingRulesBookingsPerUserComponent', () => {
  let spectator: Spectator<ResourceBookingRulesBookingsPerUserComponent>;
  const createComponent = createComponentFactory({
    component: ResourceBookingRulesBookingsPerUserComponent,
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
      IconsModule,
    ],
  });

  beforeEach(
    () =>
      (spectator = createComponent({
        props: {
          rule: mockBookingRuleBookingsPerUser,
        },
      }))
  );

  it('should create', () => {
    expect(spectator).toBeTruthy();
  });

  it('should push changes', () => {
    const pushChangesSpy = spyOn(spectator.component, 'pushChanges').and.callThrough();
    spectator.component.pushChanges(mockBookingRuleBookingsPerUserPayload);
    expect(pushChangesSpy).toHaveBeenCalledWith(mockBookingRuleBookingsPerUserPayload);
    expect(pushChangesSpy).toHaveBeenCalledTimes(1);
  });

  it('should call getUnitChoice()', () => {
    spectator.setInput({ rule: [] });

    expect(spectator.component.rule.length).toBe(0);
    expect(spectator.component.getUnitChoice()).toBe('DAY');
    spectator.component.onAdd();

    expect(spectator.component.rule.length).toBe(1);
    expect(spectator.component.getUnitChoice()).toBe('WEEK');
    spectator.component.onAdd();

    expect(spectator.component.rule.length).toBe(2);
    expect(spectator.component.getUnitChoice()).toBe('MONTH');
    spectator.component.onAdd();

    expect(spectator.component.rule.length).toBe(3);
    expect(spectator.component.getUnitChoice()).toBeNull();
  });

  it('should call onAdd()', () => {
    const onAddSpy = spyOn(spectator.component, 'onAdd').and.callThrough();
    expect(spectator.component.rule.length).toBe(2);

    spectator.component.onAdd();
    expect(onAddSpy).toHaveBeenCalledTimes(1);
    expect(spectator.component.rule.length).toBe(3);

    spectator.component.onAdd();
    expect(onAddSpy).toHaveBeenCalledTimes(2);
    expect(spectator.component.rule.length).toBe(3);
  });

  it('should call onRemove()', () => {
    const onRemoveSpy = spyOn(spectator.component, 'onRemove').and.callThrough();

    spectator.component.onRemove(mockBookingRulePerUserDay);
    expect(onRemoveSpy).toHaveBeenCalledWith(mockBookingRulePerUserDay);
    expect(onRemoveSpy).toHaveBeenCalledTimes(1);

    spectator.component.onRemove(mockBookingRulePerUserWeek);
    expect(onRemoveSpy).toHaveBeenCalledWith(mockBookingRulePerUserWeek);
    expect(onRemoveSpy).toHaveBeenCalledTimes(2);
  });

  it('should call onSetChanged()', () => {
    const onSetChangedSpy = spyOn(spectator.component, 'onSetChanged').and.callThrough();
    spectator.component.onSetChanged();
    expect(onSetChangedSpy).toHaveBeenCalledTimes(1);
  });
});
