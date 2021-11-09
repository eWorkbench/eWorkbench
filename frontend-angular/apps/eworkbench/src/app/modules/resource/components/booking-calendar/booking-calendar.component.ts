/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpParams } from '@angular/common/http';
import {
  ApplicationRef,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ComponentFactoryResolver,
  ComponentRef,
  EventEmitter,
  Injector,
  Input,
  OnInit,
  Output,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { ModalState } from '@app/enums/modal-state.enum';
import { EditAppointmentModalComponent } from '@app/modules/appointment/components/modals/edit/edit.component';
import { NewAppointmentModalComponent } from '@app/modules/appointment/components/modals/new/new.component';
import { ExportModalComponent } from '@app/modules/schedule/components/modals/export/export.component';
import { AuthService, ResourceBookingsService } from '@app/services';
import { DateService } from '@app/services/date/date.service';
import { CalendarCustomButtons } from '@eworkbench/calendar';
import { Appointment, ModalCallback, Resource, User } from '@eworkbench/types';
import {
  DateSelectArg,
  DatesSetArg,
  EventClickArg,
  EventContentArg,
  EventHoveringArg,
  MountArg,
  ToolbarInput,
} from '@fullcalendar/angular';
import { DialogRef, DialogService } from '@ngneat/dialog';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { format, parseISO, set } from 'date-fns';
import { CalendarComponent } from 'libs/calendar/src/lib/components/calendar/calendar.component';
import { CalendarPopoverWrapperComponent } from 'libs/calendar/src/lib/components/popover/popover.component';
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

  @ViewChild('popoverTemplate', { static: true })
  public popoverTemplate!: TemplateRef<any>;

  @Input()
  public headerToolbar: false | ToolbarInput = {
    left: 'timeGridWeek,dayGridMonth book',
    center: 'title',
    right: 'today prev,next export',
  };

  @Input()
  public resource!: Resource;

  @Input()
  public interval = 30;

  @Input()
  public onSubmit?: EventEmitter<boolean>;

  @Output()
  public changed = new EventEmitter<any>();

  public currentUser: User | null = null;

  public customButtons: CalendarCustomButtons = {
    book: {
      text: this.translocoService.translate('resource.calendar.book')!,
      click: () => {
        this.onOpenResourceBookingModalWithInterval();
      },
    },
    export: {
      text: this.translocoService.translate('resource.calendar.export')!,
      click: () => {
        this.openExportModal();
      },
    },
  };

  public modalRef?: DialogRef;

  public readonly dateFormat = 'yyyy-MM-dd';

  public readonly dateTimeFormat = "yyyy-MM-dd HH':'mm";

  public activeRangeStart: Date = new Date();

  public activeRangeEnd: Date = new Date();

  private readonly popoversMap = new Map<any, ComponentRef<CalendarPopoverWrapperComponent>>();

  private readonly popoverFactory = this.resolver.resolveComponentFactory(CalendarPopoverWrapperComponent);

  public constructor(
    public readonly resourceBookingsService: ResourceBookingsService,
    private readonly cdr: ChangeDetectorRef,
    private readonly dateService: DateService,
    private readonly modalService: DialogService,
    private readonly authService: AuthService,
    private readonly translocoService: TranslocoService,
    private readonly resolver: ComponentFactoryResolver,
    private readonly injector: Injector,
    private readonly appRef: ApplicationRef
  ) {}

  public ngOnInit(): void {
    this.authService.user$.pipe(untilDestroyed(this)).subscribe(state => {
      this.currentUser = state.user;
    });
  }

  public refreshAppointments(rangeStart: Date, rangeEnd: Date): void {
    this.calendar.removeAllEvents();
    this.getBookings(rangeStart, rangeEnd);
  }

  public onDatesSet(event: DatesSetArg): void {
    this.activeRangeStart = event.view.activeStart;
    this.activeRangeEnd = event.view.activeEnd;
    this.refreshAppointments(this.activeRangeStart, this.activeRangeEnd);
  }

  public getBookings(rangeStart: Date, rangeEnd: Date): void {
    const renderRangeStart = rangeStart.toISOString();
    const renderRangeEnd = rangeEnd.toISOString();

    this.calendar.removeAllEvents();

    const params = new HttpParams().set('start_date__lte', renderRangeEnd).set('end_date__gte', renderRangeStart);

    this.resourceBookingsService
      .getAll(this.resource.pk, params)
      .pipe(untilDestroyed(this))
      .subscribe(
        /* istanbul ignore next */ appointments => {
          appointments.forEach(appointment => {
            // Infamous hack for full day handling of backend with 23:59:59.999 end dates. End date will be moved to T+1 0:00:00.000.
            if (appointment.full_day && appointment.date_time_end) {
              appointment.date_time_end = this.dateService.fixFullDay(appointment.date_time_end);
            }

            /* istanbul ignore next */
            this.calendar.addEvent({
              id: appointment.pk,
              title: appointment.title,
              start: appointment.date_time_start!,
              end: appointment.date_time_end!,
              allDay: appointment.full_day,
              textColor: this.getBookingColor(appointment).textColor!,
              borderColor: this.getBookingColor(appointment).backgroundColor!,
              backgroundColor: this.getBookingColor(appointment).backgroundColor!,
              extendedProps: {
                ...appointment,
              },
            });
          });
        }
      );
  }

  public getBookingColor(appointment: Appointment): {
    textColor: string | undefined;
    backgroundColor: string | undefined;
  } {
    if (appointment.pk === 'ANONYMOUS') {
      return { backgroundColor: '#ccc', textColor: undefined };
    } else if (appointment.created_by.pk === this.currentUser?.pk) {
      return { backgroundColor: undefined, textColor: undefined };
    }
    return { backgroundColor: '#3070b3', textColor: '#fff' };
  }

  public onSelect(range: DateSelectArg): void {
    let startDate;
    let endDate;

    if (range.allDay) {
      startDate = format(set(range.start, { hours: 0, minutes: 0, seconds: 0 }), this.dateTimeFormat);
      endDate = format(set(range.end, { hours: 0, minutes: 0, seconds: 0 }), this.dateTimeFormat);
    } else {
      startDate = format(range.start, this.dateTimeFormat);
      endDate = format(range.end, this.dateTimeFormat);
    }

    this.onOpenResourceBookingModal(startDate, endDate, range.allDay);
  }

  public onEventClicked(event: EventClickArg): void {
    /* istanbul ignore next */
    const eventId = event.event._def.publicId;

    /* istanbul ignore next */
    if (eventId && eventId !== 'ANONYMOUS') {
      this.openResourceBookingDetailsModal(eventId);
    }
  }

  public onEventDidMount(event: MountArg<EventContentArg>): void {
    const projectableNodes = Array.from(event.el.childNodes);

    const compRef = this.popoverFactory.create(this.injector, [projectableNodes], event.el);
    compRef.instance.template = this.popoverTemplate;

    this.appRef.attachView(compRef.hostView);
    this.popoversMap.set(event.el, compRef);
  }

  public onEventWillUnmount(event: MountArg<EventContentArg>): void {
    const popover = this.popoversMap.get(event.el);
    if (popover) {
      this.appRef.detachView(popover.hostView);
      popover.destroy();
      this.popoversMap.delete(event.el);
    }
  }

  public onEventMouseEnter(event: EventHoveringArg): void {
    const popover = this.popoversMap.get(event.el);
    if (popover) {
      popover.instance.popover.popoverTitle = event.event.title;
      popover.instance.popover.popover = this.popoverTemplate;
      popover.instance.popover.popoverContext = { event: event.event };
      popover.instance.popover.show();
    }
  }

  public onEventMouseLeave(event: EventHoveringArg): void {
    const popover = this.popoversMap.get(event.el);
    popover?.instance.popover.hide();
  }

  public openExportModal(): void {
    /* istanbul ignore next */
    this.modalRef = this.modalService.open(ExportModalComponent, { closeButton: false });
  }

  public onOpenResourceBookingModalWithInterval(): void {
    const currentDate = new Date();
    const nextStartMinute = Math.ceil(currentDate.getMinutes() / this.interval) * this.interval;

    const start = set(parseISO(currentDate.toISOString()), {
      hours: currentDate.getHours(),
      minutes: nextStartMinute,
      seconds: 0,
    }).toISOString();
    const end = set(parseISO(currentDate.toISOString()), {
      hours: currentDate.getHours(),
      minutes: nextStartMinute + this.interval,
      seconds: 0,
    }).toISOString();

    this.onOpenResourceBookingModal(start, end);
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

  public openResourceBookingDetailsModal(id: string): void {
    this.modalRef = this.modalService.open(EditAppointmentModalComponent, {
      closeButton: false,
      data: { id },
    });

    /* istanbul ignore next */
    this.modalRef.afterClosed$
      .pipe(untilDestroyed(this), take(1))
      .subscribe((callback: { state: ModalState; event: any }) => this.onResourceBookingModalClose(callback));
  }

  public onResourceBookingModalClose(callback?: ModalCallback): void {
    if (callback?.state === ModalState.Changed) {
      /* istanbul ignore next */
      this.refreshAppointments(this.activeRangeStart, this.activeRangeEnd);
    }
  }
}
