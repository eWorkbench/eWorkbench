/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { FormsModule } from '@eworkbench/forms';
import { ResourceBookingRulesBookingsPerUserElementComponent } from './booking-rules-bookings-per-user-element.component';
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

describe('ResourceBookingRulesBookingsPerUserElementComponent', () => {
  let spectator: Spectator<ResourceBookingRulesBookingsPerUserElementComponent>;
  const createComponent = createComponentFactory({
    component: ResourceBookingRulesBookingsPerUserElementComponent,
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
            count: 1,
            unit: 'DAY',
          },
          ruleKey: 'booking_rule_minimum_duration',
        },
      }))
  );

  it('should create', () => {
    expect(spectator).toBeTruthy();
  });

  it('should push changes', () => {
    const pushChangesSpy = spyOn(spectator.component, 'pushChanges').and.callThrough();
    spectator.component.pushChanges();
    expect(pushChangesSpy).toHaveBeenCalledTimes(1);

    spectator.component.form.patchValue({
      count: null,
      unit: null,
    });
    spectator.component.pushChanges();
    expect(pushChangesSpy).toHaveBeenCalledTimes(2);
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
});
