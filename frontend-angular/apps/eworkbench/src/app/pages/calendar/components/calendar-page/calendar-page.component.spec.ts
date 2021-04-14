/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ModalState } from '@app/enums/modal-state.enum';
import { NewAppointmentModalComponent } from '@app/modules/appointment/components/modals/new/new.component';
import { HeaderModule } from '@app/modules/header/header.module';
import { LoadingModule } from '@app/modules/loading/loading.module';
import { ProjectModule } from '@app/modules/project/project.module';
import { AuthService, CalendarAccessPrivilegesService, MyScheduleService, PageTitleService } from '@app/services';
import { getTranslocoModule } from '@app/transloco-testing.module';
import { CalendarModule } from '@eworkbench/calendar';
import { FormsModule } from '@eworkbench/forms';
import { IconsModule } from '@eworkbench/icons';
import {
  mockAppointment,
  mockAppointmentDatesSetEvent,
  mockAppointmentRangeFullDayEvent,
  mockAppointmentRangePartialEvent,
  mockCalendarAccessPrivileges,
  mockExportLink,
  mockPageTitle,
  mockTask,
  mockUser,
} from '@eworkbench/mocks';
import { ModalsModule } from '@eworkbench/modals';
import { WysiwygEditorModule } from '@eworkbench/wysiwyg-editor';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { CalendarComponent } from 'libs/calendar/src/lib/components/calendar/calendar.component';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { ToastrService } from 'ngx-toastr';
import { of } from 'rxjs';
import { CalendarPageModule } from '../../calendar-page.module';
import { CalendarPageComponent } from './calendar-page.component';

const mockMySchedulesList = [mockAppointment, mockTask];

describe('CalendarPageComponent', () => {
  let spectator: Spectator<CalendarPageComponent>;
  let calendar: Spectator<CalendarComponent>;
  const createComponent = createComponentFactory({
    component: CalendarPageComponent,
    declarations: [NewAppointmentModalComponent],
    imports: [
      CalendarPageModule,
      HeaderModule,
      CalendarModule,
      FormsModule,
      ModalsModule,
      HttpClientTestingModule,
      RouterTestingModule,
      getTranslocoModule(),
      LoadingModule,
      WysiwygEditorModule,
      ProjectModule,
      BsDropdownModule.forRoot(),
      IconsModule,
    ],
    providers: [
      mockProvider(MyScheduleService, {
        getList: () => of(mockMySchedulesList),
        export: () => of(mockExportLink),
      }),
      mockProvider(AuthService, {
        user$: of({ state: { user: mockUser } }),
      }),
      mockProvider(CalendarAccessPrivilegesService, {
        getList: () => of(mockCalendarAccessPrivileges),
      }),
      mockProvider(PageTitleService, {
        get: () => of(mockPageTitle),
      }),
    ],
    mocks: [ToastrService],
  });

  const createCalendarComponent = createComponentFactory({
    component: CalendarComponent,
    imports: [CalendarModule],
  });

  beforeEach(() => (spectator = createComponent()));

  beforeEach(() => {
    calendar = createCalendarComponent();
    spectator.setInput({
      calendar: calendar.component,
    });
  });

  it('should create', () => {
    expect(spectator).toBeTruthy();
  });

  it('should call onDatesSet()', () => {
    const onDatesSetSpy = spyOn(spectator.component, 'onDatesSet').and.callThrough();
    spectator.component.onDatesSet(mockAppointmentDatesSetEvent);
    expect(onDatesSetSpy).toHaveBeenCalled();
  });

  it('should call getMySchedules()', () => {
    const getMySchedulesSpy = spyOn(spectator.component, 'getMySchedules').and.callThrough();
    spectator.component.getMySchedules(mockAppointmentDatesSetEvent.view.activeStart, mockAppointmentDatesSetEvent.view.activeEnd);
    expect(getMySchedulesSpy).toHaveBeenCalled();
  });

  it('should call onModalClose()', () => {
    const onModalCloseSpy = spyOn(spectator.component, 'onModalClose').and.callThrough();
    spectator.component.onModalClose({ state: ModalState.Unchanged, data: null });
    expect(onModalCloseSpy).toHaveBeenCalledTimes(1);
    spectator.component.onModalClose({ state: ModalState.Changed, data: null });
    expect(onModalCloseSpy).toHaveBeenCalledTimes(2);
    spectator.component.onModalClose({ state: ModalState.Unchanged, data: { test: true } });
    expect(onModalCloseSpy).toHaveBeenCalledTimes(3);
    spectator.component.onModalClose({ state: ModalState.Changed, data: { test: true } });
    expect(onModalCloseSpy).toHaveBeenCalledTimes(4);
  });

  it('should call onSelect() with partial date selection', () => {
    const onSelectSpy = spyOn(spectator.component, 'onSelect').and.callThrough();
    spectator.component.onSelect(mockAppointmentRangePartialEvent);
    expect(onSelectSpy).toHaveBeenCalled();
  });

  it('should call onSelect() with full day selection', () => {
    const onSelectSpy = spyOn(spectator.component, 'onSelect').and.callThrough();
    spectator.component.onSelect(mockAppointmentRangeFullDayEvent);
    expect(onSelectSpy).toHaveBeenCalled();
  });

  it('should have a custom export button', () => {
    expect(spectator.component.customButtons.hasOwnProperty('export')).toBe(true);
  });

  it('should call the click function on the export button', () => {
    const clickFunctionSpy = spyOn(spectator.component.customButtons.export, 'click').and.callThrough();
    spectator.component.customButtons.export.click!({} as any, {} as any);
    expect(clickFunctionSpy).toHaveBeenCalledTimes(1);
  });

  it('should call onOpenPrivilegesModal()', () => {
    spectator.setInput({ calendarAccessPrivileges: mockCalendarAccessPrivileges });
    const onOpenPrivilegesModalSpy = spyOn(spectator.component, 'onOpenPrivilegesModal').and.callThrough();
    spectator.component.onOpenPrivilegesModal();
    expect(onOpenPrivilegesModalSpy).toHaveBeenCalled;
  });

  it('should call onSelectUser()', () => {
    const onSelectUserSpy = spyOn(spectator.component, 'onSelectUser').and.callThrough();

    spectator.component.onSelectUser(mockUser);
    expect(onSelectUserSpy).toHaveBeenCalledTimes(1);

    spectator.setInput({ users: [mockUser] });
    spectator.component.onSelectUser(mockUser);
    expect(onSelectUserSpy).toHaveBeenCalledTimes(2);

    spectator.component.onSelectUser();
    expect(onSelectUserSpy).toHaveBeenCalledTimes(3);
  });

  it('should call onRemoveSelectedUser()', () => {
    spectator.setInput({ selectedUsers: [mockUser] });
    const onRemoveSelectedUserSpy = spyOn(spectator.component, 'onRemoveSelectedUser').and.callThrough();

    spectator.component.onRemoveSelectedUser(mockUser);
    expect(onRemoveSelectedUserSpy).toHaveBeenCalled();
  });

  it('should call getUnusedUsers()', () => {
    const getUnusedUsersSpy = spyOn(spectator.component, 'getUnusedUsers').and.callThrough();
    spectator.component.getUnusedUsers([mockUser]);
    expect(getUnusedUsersSpy).toHaveBeenCalled();
  });

  describe('MyScheduleService', () => {
    beforeEach(() => spectator.component.calendar.removeAllEvents());

    it('should get schedules from service via getMySchedules()', () => {
      expect(spectator.component.calendar.getEvents().length).toBe(0);
      spectator.component.getMySchedules(mockAppointmentDatesSetEvent.view.activeStart, mockAppointmentDatesSetEvent.view.activeEnd);
      expect(spectator.component.calendar.getEvents().length).toBe(mockMySchedulesList.length);
    });

    it('should get schedules from service via onDatesSet()', () => {
      expect(spectator.component.calendar.getEvents().length).toBe(0);
      spectator.component.onDatesSet(mockAppointmentDatesSetEvent);
      expect(spectator.component.calendar.getEvents().length).toBe(mockMySchedulesList.length);
    });
  });
});
