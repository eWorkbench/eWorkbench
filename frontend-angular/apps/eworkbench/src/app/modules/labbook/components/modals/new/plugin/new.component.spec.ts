/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { LoadingModule } from '@app/modules/loading/loading.module';
import { PluginModule } from '@app/modules/plugin/plugin.module';
import { getTranslocoModule } from '@app/transloco-testing.module';
import { FormsModule } from '@eworkbench/forms';
import { IconsModule } from '@eworkbench/icons';
import { mockPluginDetails } from '@eworkbench/mocks';
import { ModalsModule } from '@eworkbench/modals';
import { DialogRef } from '@ngneat/dialog';
import { mockProvider, createRoutingFactory, Spectator } from '@ngneat/spectator/jest';
import { ToastrService } from 'ngx-toastr';
import { Subject } from 'rxjs';
import { NewLabBookPluginElementModalComponent } from './new.component';

const mockEvent = {
  type: 'feedback',
  id: 'b09d0e46-5aa7-489e-a9ae-2b9750bf41cd',
};

describe('NewLabBookPluginElementModalComponent', () => {
  let spectator: Spectator<NewLabBookPluginElementModalComponent>;
  const createComponent = createRoutingFactory({
    component: NewLabBookPluginElementModalComponent,
    imports: [ModalsModule, FormsModule, HttpClientTestingModule, getTranslocoModule(), LoadingModule, IconsModule, PluginModule],
    providers: [
      mockProvider(DialogRef, {
        close: () => {},
        afterClosed$: new Subject(),
        data: {},
      }),
    ],
    mocks: [ToastrService],
  });

  beforeEach(() => (spectator = createComponent()));

  it('should create', () => {
    expect(spectator).toBeTruthy();
  });

  it('should call onSubmit()', () => {
    const onSubmitSpy = jest.spyOn(spectator.component, 'onSubmit');
    spectator.setInput({
      loading: false,
    });
    spectator.component.onSubmit();
    expect(onSubmitSpy).toHaveBeenCalledTimes(1);
    spectator.setInput({
      loading: true,
    });
    spectator.component.onSubmit();
    expect(onSubmitSpy).toHaveBeenCalledTimes(2);
  });

  it('should call onToogleOnlyPluginsWithAccess()', () => {
    const onToogleOnlyPluginsWithAccessSpy = jest.spyOn(spectator.component, 'onToogleOnlyPluginsWithAccess');
    spectator.setInput({
      loading: false,
    });
    spectator.component.onToogleOnlyPluginsWithAccess();
    expect(onToogleOnlyPluginsWithAccessSpy).toHaveBeenCalledTimes(1);
    spectator.setInput({
      loading: true,
    });
    spectator.component.onToogleOnlyPluginsWithAccess();
    expect(onToogleOnlyPluginsWithAccessSpy).toHaveBeenCalledTimes(2);
  });

  it('should call onChangeStep()', () => {
    expect(spectator.component.step).toBe(1);
    spectator.component.onChangeStep(2);
    expect(spectator.component.step).toBe(2);
  });

  it('should call onCancelDetails()', () => {
    spectator.setInput({
      pluginDetails: mockPluginDetails,
      showFeedbackFormForPlugin: mockEvent,
    });
    expect(spectator.component.pluginDetails).toEqual(mockPluginDetails);
    expect(spectator.component.showFeedbackFormForPlugin).toEqual(mockEvent);

    spectator.component.onCancelDetails();
    expect(spectator.component.pluginDetails).toBeUndefined();
    expect(spectator.component.showFeedbackFormForPlugin).toBeUndefined();
  });

  it('should call onShowDetails()', () => {
    spectator.setInput({ showFeedbackFormForPlugin: mockEvent });
    expect(spectator.component.pluginDetails).toBeUndefined();

    spectator.component.onShowDetails(mockPluginDetails);
    expect(spectator.component.pluginDetails).toEqual(mockPluginDetails);
    expect(spectator.component.showFeedbackFormForPlugin).toBeUndefined();
  });

  it('should call onSelect()', () => {
    spectator.setInput({ showFeedbackFormForPlugin: mockEvent });
    expect(spectator.component.selectedPlugin).toBeUndefined();
    expect(spectator.component.showFeedbackFormForPlugin).toEqual(mockEvent);
    expect(spectator.component.step).toBe(1);

    spectator.component.onSelect(mockPluginDetails);
    expect(spectator.component.selectedPlugin).toEqual(mockPluginDetails);
    expect(spectator.component.showFeedbackFormForPlugin).toBeUndefined();
    expect(spectator.component.step).toBe(2);
  });

  it('should call onDropdownSelected()', () => {
    expect(spectator.component.showFeedbackFormForPlugin).toBeUndefined();
    spectator.component.onDropdownSelected(mockEvent);
    expect(spectator.component.showFeedbackFormForPlugin).toEqual(mockEvent);
  });

  it('should call onHideFeedbackForm()', () => {
    spectator.setInput({ showFeedbackFormForPlugin: mockEvent });
    expect(spectator.component.showFeedbackFormForPlugin).toEqual(mockEvent);
    spectator.component.onHideFeedbackForm();
    expect(spectator.component.showFeedbackFormForPlugin).toBeUndefined();
  });
});
