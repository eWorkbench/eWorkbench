/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormHelperModule } from '@app/modules/form-helper/form-helper.module';
import { LoadingModule } from '@app/modules/loading/loading.module';
import { LockModule } from '@app/modules/lock/lock.module';
import { MetadataModule } from '@app/modules/metadata/metadata.module';
import { AppointmentsService } from '@app/services';
import { getTranslocoModule } from '@app/transloco-testing.module';
import { CalendarModule } from '@eworkbench/calendar';
import { FormsModule } from '@eworkbench/forms';
import { IconsModule } from '@eworkbench/icons';
import { mockAppointment, mockUser } from '@eworkbench/mocks';
import { ModalsModule } from '@eworkbench/modals';
import { WysiwygEditorModule } from '@eworkbench/wysiwyg-editor';
import { FullCalendarModule } from '@fullcalendar/angular';
import { DialogRef } from '@ngneat/dialog';
import { createRoutingFactory, mockProvider, Spectator } from '@ngneat/spectator';
import { format, parseISO } from 'date-fns';
import { ToastrService } from 'ngx-toastr';
import { of, Subject } from 'rxjs';
import { EditAppointmentModalComponent } from './edit.component';

describe('EditAppointmentModalComponent', () => {
  let spectator: Spectator<EditAppointmentModalComponent>;
  const createComponent = createRoutingFactory({
    component: EditAppointmentModalComponent,
    imports: [
      ModalsModule,
      FormsModule,
      CalendarModule,
      FullCalendarModule,
      HttpClientTestingModule,
      getTranslocoModule(),
      LoadingModule,
      WysiwygEditorModule,
      MetadataModule,
      FormHelperModule,
      LockModule,
      IconsModule,
    ],
    providers: [
      mockProvider(AppointmentsService, {
        get: () => of(mockAppointment),
        patch: () => of(mockAppointment),
        delete: () => of(mockAppointment),
      }),
      mockProvider(DialogRef, {
        close: () => {},
        afterClosed$: new Subject(),
        data: { currentUser: mockUser, id: mockAppointment.pk, initialState: mockAppointment },
      }),
    ],
    mocks: [ToastrService],
  });

  beforeEach(() => (spectator = createComponent()));

  it('should create', () => {
    expect(spectator).toBeTruthy();
  });

  it('should call onSubmit()', () => {
    const onSubmitSpy = spyOn(spectator.component, 'onSubmit').and.callThrough();
    spectator.component.onSubmit();
    expect(onSubmitSpy).toHaveBeenCalledTimes(1);

    spectator.setInput({
      loading: false,
    });
    spectator.component.form.patchValue({
      title: mockAppointment.title,
      dateGroup: {
        start: mockAppointment.date_time_start ? format(parseISO(mockAppointment.date_time_start), spectator.component.dateFormat) : null,
        end: mockAppointment.date_time_end ? format(parseISO(mockAppointment.date_time_end), spectator.component.dateFormat) : null,
        fullDay: false,
      },
    });
    spectator.component.onSubmit();
    expect(onSubmitSpy).toHaveBeenCalledTimes(2);

    spectator.component.form.patchValue({
      scheduledNotificationActive: true,
      scheduledNotificationTimedeltaValue: 15,
      scheduledNotificationTimedeltaUnit: 'MINUTE',
    });
    spectator.component.onSubmit();
    expect(onSubmitSpy).toHaveBeenCalledTimes(3);
  });

  it('should call onDelete()', () => {
    const onDeleteSpy = spyOn(spectator.component, 'onDelete').and.callThrough();
    spectator.component.onDelete();
    expect(onDeleteSpy).toHaveBeenCalledTimes(1);
    spectator.setInput({
      loading: false,
    });
    spectator.component.onDelete();
    expect(onDeleteSpy).toHaveBeenCalledTimes(2);
  });

  it('should call initDetails()', () => {
    const initDetailsSpy = spyOn(spectator.component, 'initDetails').and.callThrough();
    spectator.setInput({
      currentUser: mockUser,
    });
    spectator.component.initDetails();
    expect(initDetailsSpy).toHaveBeenCalledTimes(1);
  });
});
