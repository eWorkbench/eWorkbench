/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { getTranslocoModule } from '@app/transloco-testing.module';
import { FormsModule } from '@eworkbench/forms';
import { IconsModule } from '@eworkbench/icons';
import { mockPluginDetails } from '@eworkbench/mocks';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { CollapseModule } from 'ngx-bootstrap/collapse';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { PluginDetailsDropdownComponent } from './details-dropdown.component';

describe('PluginDetailsDropdownComponent', () => {
  let spectator: Spectator<PluginDetailsDropdownComponent>;
  const createComponent = createComponentFactory({
    component: PluginDetailsDropdownComponent,
    imports: [
      HttpClientTestingModule,
      FormsModule,
      getTranslocoModule(),
      CollapseModule.forRoot(),
      BsDropdownModule.forRoot(),
      RouterTestingModule,
      IconsModule,
    ],
  });

  beforeEach(() => (spectator = createComponent({ props: { plugin: mockPluginDetails } })));

  it('should create', () => {
    expect(spectator).toBeTruthy();
  });

  it('should call onGiveFeedback()', () => {
    const onGiveFeedbackSpy = jest.spyOn(spectator.component, 'onGiveFeedback');
    spectator.component.onGiveFeedback();
    expect(onGiveFeedbackSpy).toHaveBeenCalledTimes(1);
  });

  it('should call onRequestAccess()', () => {
    const onRequestAccessSpy = jest.spyOn(spectator.component, 'onRequestAccess');
    spectator.component.onRequestAccess();
    expect(onRequestAccessSpy).toHaveBeenCalledTimes(1);
  });
});
