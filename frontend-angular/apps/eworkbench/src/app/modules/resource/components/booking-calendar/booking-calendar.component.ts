/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { ModalState } from '@app/enums/modal-state.enum';
import { EditAppointmentModalComponent } from '@app/modules/appointment/components/modals/edit/edit.component';
import { NewAppointmentModalComponent } from '@app/modules/appointment/components/modals/new/new.component';
import { ExportModalComponent } from '@app/modules/schedule/components/modals/export/export.component';
import { AuthService, ResourceBookingsService } from '@app/services';
import { CalendarCustomButtons } from '@eworkbench/calendar';
import { ModalCallback, Resource, User } from '@eworkbench/types';
import { DateSelectArg, DatesSetArg, EventClickArg, ToolbarInput } from '@fullcalendar/angular';
import { DialogRef, DialogService } from '@ngneat/dialog';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { format, set } from 'date-fns';
import { CalendarComponent } from 'libs/calendar/src/lib/components/calendar/calendar.component';
import { take } from 'rxjs/operators';

@UntilDestroy()
@Component({
  selector: 'eworkbench-resource-booking-calendar',
  templateUrl: './booking-calendar.component.html',
  styleUrls: ['./booking-calendar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResourceBookingCalendarComponent implements OnInit {
  @ViewChild('calendar', { static: true })
  public calendar!: CalendarComponent;

  @Input()
  public headerToolbar: false | ToolbarInput = {
    left: 'timeGridWeek,dayGridMonth book',
    center: 'title',
    right: 'today prev,next export',
  };

  @Input()
  public resource!: Resource;

  @Output()
  public changed = new EventEmitter<any>();

  public currentUser: User | null = null;

  public customButtons: CalendarCustomButtons = {
    book: {
      text: this.translocoService.translate('resource.calendar.book'),
      click: () => {
        this.onOpenResourceBookingModal();
      },
    },
    export: {
      text: this.translocoService.translate('resource.calendar.export'),
      click: () => {
        this.openExportModal();
      },
    },
  };

  public modalRef?: DialogRef;

  public readonly dateFormat = "yyyy-MM-dd HH':'mm";

  public constructor(
    public readonly resourceBookingsService: ResourceBookingsService,
    private readonly cdr: ChangeDetectorRef,
    private readonly modalService: DialogService,
    private readonly authService: AuthService,
    private readonly translocoService: TranslocoService
  ) {}

  public ngOnInit(): void {
    this.authService.user$.pipe(untilDestroyed(this)).subscribe(state => {
      this.currentUser = state.user;
    });
  }

  public onDatesSet(event: DatesSetArg): void {
    this.getBookings(event);
  }

  public getBookings(event: DatesSetArg): void {
    const renderRangeEnd = event.view.activeEnd;

    this.calendar.removeAllEvents();

    this.resourceBookingsService
      .getAll(this.resource.pk)
      .pipe(untilDestroyed(this))
      .subscribe(
        /* istanbul ignore next */ appointments => {
          appointments.forEach(appointment => {
            /* istanbul ignore next */
            this.calendar.addEvent({
              id: appointment.pk,
              title: appointment.title,
              start: appointment.date_time_start!,
              end: appointment.date_time_end!,
              allDay: appointment.full_day,
            });
          });
        }
      );

    this.resourceBookingsService
      .getMine(this.resource.pk, renderRangeEnd.toISOString())
      .pipe(untilDestroyed(this))
      .subscribe(
        /* istanbul ignore next */ appointments => {
          appointments.forEach(appointment => {
            /* istanbul ignore next */
            this.calendar.addEvent({
              id: appointment.pk,
              title: appointment.title,
              start: appointment.date_time_start!,
              end: appointment.date_time_end!,
              allDay: appointment.full_day,
            });
          });
        }
      );
  }

  public onSelect(range: DateSelectArg): void {
    let startDate;
    let endDate;

    if (range.allDay) {
      startDate = format(set(range.start, { hours: 0, minutes: 0, seconds: 0 }), this.dateFormat);
      endDate = format(set(range.end, { hours: 0, minutes: 0, seconds: 0 }), this.dateFormat);
    } else {
      startDate = format(range.start, this.dateFormat);
      endDate = format(range.end, this.dateFormat);
    }

    this.onOpenResourceBookingModal(startDate, endDate, range.allDay);
  }

  public onEventClicked(event: EventClickArg): void {
    /* istanbul ignore next */
    const eventId = event.event._def.publicId;

    /* istanbul ignore next */
    if (eventId) {
      this.openResourceBookingDetailsModal(eventId);
    }
  }

  public openExportModal(): void {
    /* istanbul ignore next */
    this.modalRef = this.modalService.open(ExportModalComponent, { closeButton: false });
  }

  public onOpenResourceBookingModal(startDate?: string, endDate?: string, allDay?: boolean): void {
    this.translocoService
      .selectTranslate('appointment.title')
      .pipe(untilDestroyed(this))
      .subscribe(title => {
        this.modalRef = this.modalService.open(NewAppointmentModalComponent, {
          closeButton: false,
          data: {
            initialState: {
              title,
              projects: [],
            },
            selectedStartDate: startDate,
            selectedEndDate: endDate,
            selectedFullDay: allDay,
            resource: this.resource,
          },
        });

        /* istanbul ignore next */
        this.modalRef.afterClosed$
          .pipe(untilDestroyed(this), take(1))
          .subscribe((callback: { state: ModalState; event: any }) => this.onResourceBookingModalClose(callback));
      });
  }

  public onResourceBookingModalClose(callback?: ModalCallback): void {
    if (callback?.state === ModalState.Changed) {
      /* istanbul ignore next */
      const event = callback.data?.event;
      if (event) {
        this.calendar.addEvent({
          id: event.id,
          title: event.title,
          start: event.start,
          end: event.end,
          allDay: event.fullDay,
        });
        this.changed.emit(callback.data);
        this.cdr.markForCheck();
      }
    }
  }

  public openResourceBookingDetailsModal(id: string): void {
    this.modalRef = this.modalService.open(EditAppointmentModalComponent, {
      closeButton: false,
      data: { id },
    });

    /* istanbul ignore next */
    this.modalRef.afterClosed$
      .pipe(untilDestroyed(this), take(1))
      .subscribe((callback: { state: ModalState; event: any }) => this.onEditResourceBookingModalClose(callback));
  }

  public onEditResourceBookingModalClose(callback?: ModalCallback): void {
    if (callback?.state === ModalState.Changed) {
      const event = callback.data;
      if (event) {
        if (event.deleted === true) {
          /* istanbul ignore next */
          this.calendar.removeEvent({
            id: event.id,
          });
        } else {
          /* istanbul ignore next */
          this.calendar.editEvent({
            id: event.id,
            title: event.title,
            start: event.start,
            end: event.end,
            allDay: event.fullDay,
          });
        }
        this.changed.emit(event);
        this.cdr.markForCheck();
      }
    }
  }
}
