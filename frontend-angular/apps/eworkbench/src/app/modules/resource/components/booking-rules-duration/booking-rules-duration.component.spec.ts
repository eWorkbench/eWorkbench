/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { FormsModule } from '@eworkbench/forms';
import { ResourceBookingRulesDurationComponent } from './booking-rules-duration.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { getTranslocoModule } from '@app/transloco-testing.module';
import { FormHelperModule } from '@app/modules/form-helper/form-helper.module';
import { TableModule } from '@eworkbench/table';
import { UserModule } from '@app/modules/user/user.module';
import { RouterTestingModule } from '@angular/router/testing';
import { SharedModule } from '@app/modules/shared/shared.module';
import { TrashModule } from '@app/modules/trash/trash.module';
import { ResourceModule } from '@app/modules/resource/resource.module';
import { ModalsModule } from '@eworkbench/modals';

describe('ResourceBookingRulesDurationComponent', () => {
  let spectator: Spectator<ResourceBookingRulesDurationComponent>;
  const createComponent = createComponentFactory({
    component: ResourceBookingRulesDurationComponent,
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
          rule: {
            id: 'a9eee3f0-d38d-42d1-bbb4-e4b29ee95751',
            duration: '0 02:00:00',
          },
          ruleKey: 'booking_rule_minimum_duration',
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
    const pushChangesSpy = jest.spyOn(spectator.component, 'pushChanges');
    spectator.component.pushChanges();
    expect(pushChangesSpy).toHaveBeenCalledTimes(1);

    spectator.component.form.patchValue({
      days: null,
      duration: null,
    });
    spectator.component.pushChanges();
    expect(pushChangesSpy).toHaveBeenCalledTimes(2);
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
});
