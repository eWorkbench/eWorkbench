/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ModalState } from '@app/enums/modal-state.enum';
import { DMPModule } from '@app/modules/dmp/dmp.module';
import { HeaderModule } from '@app/modules/header/header.module';
import { LoadingModule } from '@app/modules/loading/loading.module';
import { ProjectModule } from '@app/modules/project/project.module';
import { ResourceModule } from '@app/modules/resource/resource.module';
import { SharedModule } from '@app/modules/shared/shared.module';
import { TaskModule } from '@app/modules/task/task.module';
import { AuthService, MyScheduleService, PageTitleService } from '@app/services';
import { getTranslocoModule } from '@app/transloco-testing.module';
import { CalendarModule } from '@eworkbench/calendar';
import { FormsModule } from '@eworkbench/forms';
import { IconsModule } from '@eworkbench/icons';
import {
  mockAppointment,
  mockAppointmentDatesSetEvent,
  mockAppointmentRangeFullDayEvent,
  mockAppointmentRangePartialEvent,
  mockPageTitle,
  mockTask,
  mockUser,
} from '@eworkbench/mocks';
import { ModalsModule } from '@eworkbench/modals';
import { SkeletonsModule } from '@eworkbench/skeletons';
import { TableModule } from '@eworkbench/table';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { CollapseModule } from 'ngx-bootstrap/collapse';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { ToastrService } from 'ngx-toastr';
import { of } from 'rxjs';
import { DashboardElementComponent } from '../dashboard-element/dashboard-element.component';
import { DashboardPageComponent } from './dashboard-page.component';

const mockMySchedulesList = [mockAppointment, mockTask];

describe('DashboardPageComponent', () => {
  let spectator: Spectator<DashboardPageComponent>;
  const createComponent = createComponentFactory({
    component: DashboardPageComponent,
    declarations: [DashboardElementComponent],
    imports: [
      HeaderModule,
      getTranslocoModule(),
      TableModule,
      ModalsModule,
      CalendarModule,
      HttpClientTestingModule,
      RouterTestingModule,
      FormsModule,
      LoadingModule,
      SharedModule,
      BsDropdownModule.forRoot(),
      IconsModule,
      ProjectModule,
      TaskModule,
      DMPModule,
      ResourceModule,
      TooltipModule.forRoot(),
      CollapseModule.forRoot(),
      SkeletonsModule,
    ],
    providers: [
      mockProvider(MyScheduleService, {
        getList: () => of(mockMySchedulesList),
      }),
      mockProvider(AuthService, {
        user$: of({ state: { user: mockUser } }),
      }),
      mockProvider(PageTitleService, {
        get: () => of(mockPageTitle),
      }),
    ],
    mocks: [ToastrService],
  });

  beforeEach(
    () =>
      (spectator = createComponent({
        props: {
          dashboard: {
            contacts: [],
            dmps: [],
            files: [],
            projects: [],
            resources: [],
            tasks: [],
            summary: { test: 2 },
          } as any,
        },
      }))
  );

  it('should create', () => {
    spectator.component.renderBubbleChart();
    expect(spectator).toBeTruthy();
  });

  it('should call onAppointmentModalClose()', () => {
    const onAppointmentModalCloseSpy = jest.spyOn(spectator.component, 'onAppointmentModalClose');
    spectator.component.onAppointmentModalClose({ state: ModalState.Unchanged, data: mockAppointment });
    expect(onAppointmentModalCloseSpy).toHaveBeenCalledWith({ state: ModalState.Unchanged, data: mockAppointment });
    expect(onAppointmentModalCloseSpy).toHaveBeenCalledTimes(1);
    spectator.component.onAppointmentModalClose({ state: ModalState.Changed, data: mockAppointment });
    expect(onAppointmentModalCloseSpy).toHaveBeenCalledWith({ state: ModalState.Changed, data: mockAppointment });
    expect(onAppointmentModalCloseSpy).toHaveBeenCalledTimes(2);
  });

  it('should call onModalClose()', () => {
    spectator.fixture.ngZone?.run(() => {
      const onModalCloseSpy = jest.spyOn(spectator.component, 'onModalClose');
      spectator.component.onModalClose({});
      expect(onModalCloseSpy).toHaveBeenCalledWith({});
      expect(onModalCloseSpy).toHaveBeenCalledTimes(1);
      spectator.component.onModalClose({ navigate: ['/'] });
      expect(onModalCloseSpy).toHaveBeenCalledWith({ navigate: ['/'] });
      expect(onModalCloseSpy).toHaveBeenCalledTimes(2);
    });
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
