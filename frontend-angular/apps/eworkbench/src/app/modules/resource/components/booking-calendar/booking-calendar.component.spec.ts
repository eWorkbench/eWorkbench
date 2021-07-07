/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ModalState } from '@app/enums/modal-state.enum';
import { FormHelperModule } from '@app/modules/form-helper/form-helper.module';
import { ResourceModule } from '@app/modules/resource/resource.module';
import { SharedModule } from '@app/modules/shared/shared.module';
import { TrashModule } from '@app/modules/trash/trash.module';
import { UserModule } from '@app/modules/user/user.module';
import { AuthService, MyScheduleService, ResourceBookingsService } from '@app/services';
import { getTranslocoModule } from '@app/transloco-testing.module';
import { CalendarModule } from '@eworkbench/calendar';
import { FormsModule } from '@eworkbench/forms';
import {
  mockAppointment,
  mockAppointmentRangeFullDayEvent,
  mockAppointmentRangePartialEvent,
  mockExportLink,
  mockResource,
  mockUser,
} from '@eworkbench/mocks';
import { ModalsModule } from '@eworkbench/modals';
import { TableModule } from '@eworkbench/table';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { ToastrService } from 'ngx-toastr';
import { of } from 'rxjs';
import { ResourceBookingCalendarComponent } from './booking-calendar.component';

describe('ResourceBookingCalendarComponent', () => {
  let spectator: Spectator<ResourceBookingCalendarComponent>;
  const createComponent = createComponentFactory({
    component: ResourceBookingCalendarComponent,
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
      CalendarModule,
    ],
    providers: [
      mockProvider(MyScheduleService, {
        export: () => of(mockExportLink),
      }),
      mockProvider(ResourceBookingsService, {
        getAll: () => of([mockAppointment]),
        getMine: () => of([mockAppointment]),
      }),
      mockProvider(AuthService, {
        user$: of({ state: { user: mockUser } }),
      }),
    ],
    mocks: [ToastrService],
  });

  beforeEach(() => (spectator = createComponent({ props: { resource: mockResource } })));

  it('should create', () => {
    expect(spectator).toBeTruthy();
  });

  it('should have a custom export button', () => {
    expect(spectator.component.customButtons.hasOwnProperty('export')).toBe(true);
  });

  it('should call the click function on the export button', () => {
    const clickFunctionSpy = jest.spyOn(spectator.component.customButtons.export, 'click');
    spectator.component.customButtons.export.click!({} as any, {} as any);
    expect(clickFunctionSpy).toHaveBeenCalledTimes(1);
  });

  it('should call onSelect() with partial date selection', () => {
    const onSelectSpy = jest.spyOn(spectator.component, 'onSelect');
    spectator.component.onSelect(mockAppointmentRangePartialEvent);
    expect(onSelectSpy).toHaveBeenCalledTimes(1);
  });

  it('should call onSelect() with full day selection', () => {
    const onSelectSpy = jest.spyOn(spectator.component, 'onSelect');
    spectator.component.onSelect(mockAppointmentRangeFullDayEvent);
    expect(onSelectSpy).toHaveBeenCalledTimes(1);
  });

  it('should have a custom book button', () => {
    expect(spectator.component.customButtons.hasOwnProperty('book')).toBe(true);
  });

  it('should call the click function on the book button', () => {
    const clickFunctionSpy = jest.spyOn(spectator.component.customButtons.book, 'click');
    spectator.component.customButtons.book.click!({} as any, {} as any);
    expect(clickFunctionSpy).toHaveBeenCalledTimes(1);
  });

  it('should call onResourceBookingModalClose()', () => {
    const onResourceBookingModalCloseSpy = jest.spyOn(spectator.component, 'onResourceBookingModalClose');
    spectator.component.onResourceBookingModalClose({ state: ModalState.Unchanged });
    expect(onResourceBookingModalCloseSpy).toHaveBeenCalledWith({ state: ModalState.Unchanged });
    expect(onResourceBookingModalCloseSpy).toHaveBeenCalledTimes(1);
    spectator.component.onResourceBookingModalClose({ state: ModalState.Changed });
    expect(onResourceBookingModalCloseSpy).toHaveBeenCalledWith({ state: ModalState.Changed });
    expect(onResourceBookingModalCloseSpy).toHaveBeenCalledTimes(2);
  });
});
