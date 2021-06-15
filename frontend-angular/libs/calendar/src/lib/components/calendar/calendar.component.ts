/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output, ViewChild, ViewEncapsulation } from '@angular/core';
import {
  AllDayContentArg,
  BusinessHoursInput,
  ButtonIconsInput,
  ButtonTextCompoundInput,
  Calendar,
  CalendarOptions,
  ConstraintInput,
  CustomButtonInput,
  CustomContentGenerator,
  DateSelectArg,
  DatesSetArg,
  EventApi,
  EventClickArg,
  EventContentArg,
  EventHoveringArg,
  EventInput,
  FormatterInput,
  FullCalendarComponent,
  LocaleSingularArg,
  MountArg,
  OverlapFunc,
  PluginDef,
  ToolbarInput,
  MoreLinkAction,
  MoreLinkContentArg,
} from '@fullcalendar/angular';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin, { NoEventsContentArg } from '@fullcalendar/list';
import timeGridPlugin from '@fullcalendar/timegrid';
import {
  CalendarDateFormat,
  CalendarDayHeaderFormat,
  CalendarDayPopoverFormat,
  CalendarSlotInterval,
  CalendarTimeFormat,
} from '../../interfaces/calendar.interfaces';

@Component({
  selector: 'eworkbench-calendar',
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class CalendarComponent implements OnInit {
  @ViewChild('calendar', { static: true })
  public calendar!: FullCalendarComponent;

  public plugins: PluginDef[] = [dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin];

  public options: CalendarOptions = {};

  @Input()
  public locale: LocaleSingularArg = 'en-GB';

  @Input()
  public themeSystem?: string;

  @Input()
  public height: string | number = 'auto';

  @Input()
  public contentHeight: string | number = 'auto';

  @Input()
  public aspectRatio = 1.35;

  @Input()
  public initialView: 'dayGridWeek' | 'timeGridWeek' | 'listWeek' | 'dayGridMonth' = 'timeGridWeek';

  @Input()
  public weekends = true;

  @Input()
  public hiddenDays?: number[];

  @Input()
  public headerToolbar: false | ToolbarInput = {
    left: 'prev,next today',
    center: 'title',
    right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek',
  };

  @Input()
  public allDaySlot?: boolean;

  @Input()
  public allDayContent: CustomContentGenerator<AllDayContentArg>;

  @Input()
  public slotEventOverlap = true;

  @Input()
  public dayMaxEvents: boolean | number = 4;

  @Input()
  public eventDisplay: 'auto' | 'block' | 'list-item' | 'background' | 'inverse-background' | 'none' = 'block';

  @Input()
  public listDayFormat?: CalendarDateFormat | false;

  @Input()
  public listDaySideFormat?: CalendarDateFormat | false;

  @Input()
  public footerToolbar: false | ToolbarInput = false;

  @Input()
  public titleFormat: FormatterInput = { year: 'numeric', month: 'long', day: 'numeric' };

  @Input()
  public titleRangeSeparator?: string;

  @Input()
  public buttonText?: ButtonTextCompoundInput;

  @Input()
  public buttonIcons?: ButtonIconsInput | false;

  @Input()
  public customButtons?: { [name: string]: CustomButtonInput };

  @Input()
  public dayHeaders = true;

  @Input()
  public dayHeaderFormat: CalendarDayHeaderFormat = {
    weekday: 'short',
    month: 'numeric',
    day: 'numeric',
    omitCommas: false,
  };

  @Input()
  public dayHeaderFormatMonthView: CalendarDayHeaderFormat = { weekday: 'long' };

  @Input()
  public slotDuration: string | CalendarSlotInterval = '00:30:00';

  @Input()
  public slotLabelInterval: string | CalendarSlotInterval = '01:00';

  @Input()
  public slotLabelFormat: CalendarDateFormat = {
    hour: '2-digit',
    minute: '2-digit',
    omitZeroMinute: false,
    meridiem: false,
    hour12: false,
  };

  @Input()
  public timeZone = 'local';

  @Input()
  public slotMinTime = '00:00:00';

  @Input()
  public slotMaxTime = '24:00:00';

  @Input()
  public scrollTime = '08:00:00';

  @Input()
  public showNonCurrentDates = true;

  @Input()
  public fixedWeekCount = false;

  @Input()
  public firstDay = 1;

  @Input()
  public initialDate?: string;

  @Input()
  public navLinks = false;

  @Input()
  public weekNumbers = true;

  @Input()
  public weekNumberCalculation: 'local' | 'ISO' | ((m: Date) => number) = 'ISO';

  @Input()
  public weekText?: string;

  @Input()
  public nowIndicator = true;

  @Input()
  public businessHours?: BusinessHoursInput;

  @Input()
  public noEventsContent?: CustomContentGenerator<NoEventsContentArg>;

  @Input()
  public eventTimeFormat: CalendarTimeFormat = {
    hour: 'numeric',
    minute: '2-digit',
    meridiem: 'short',
  };

  @Input()
  public moreLinkContent?: CustomContentGenerator<MoreLinkContentArg>;

  @Input()
  public moreLinkClick: MoreLinkAction = 'week';

  @Input()
  public selectable = true;

  @Input()
  public selectMirror = true;

  @Input()
  public selectOverlap: boolean | OverlapFunc = true;

  @Input()
  public selectConstraint?: ConstraintInput;

  @Input()
  public dragScroll = true;

  @Input()
  public dayPopoverFormat: CalendarDayPopoverFormat = {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  };

  @Input()
  public deepChangeDetection = false;

  @Output()
  public datesSet = new EventEmitter<DatesSetArg>();

  @Output()
  public selected = new EventEmitter<DateSelectArg>();

  @Output()
  public eventClicked = new EventEmitter<EventClickArg>();

  @Output()
  public eventDidMount = new EventEmitter<MountArg<EventContentArg>>();

  @Output()
  public eventWillUnmount = new EventEmitter<MountArg<EventContentArg>>();

  @Output()
  public eventMouseEnter = new EventEmitter<EventHoveringArg>();

  @Output()
  public eventMouseLeave = new EventEmitter<EventHoveringArg>();

  public ngOnInit(): void {
    Calendar.name; // Prevent webpack from removing the reference during compilation
    this.options = {
      plugins: this.plugins,
      locale: this.locale,
      themeSystem: this.themeSystem,
      height: this.height,
      contentHeight: this.contentHeight,
      aspectRatio: this.aspectRatio,
      initialView: this.initialView,
      weekends: this.weekends,
      hiddenDays: this.hiddenDays,
      headerToolbar: this.headerToolbar,
      allDaySlot: this.allDaySlot,
      allDayContent: this.allDayContent,
      slotEventOverlap: this.slotEventOverlap,
      dayMaxEvents: this.dayMaxEvents,
      eventDisplay: this.eventDisplay,
      listDayFormat: this.listDayFormat,
      listDaySideFormat: this.listDaySideFormat,
      footerToolbar: this.footerToolbar,
      titleFormat: this.titleFormat,
      titleRangeSeparator: this.titleRangeSeparator,
      buttonText: this.buttonText,
      buttonIcons: this.buttonIcons,
      customButtons: this.customButtons,
      dayHeaders: this.dayHeaders,
      dayHeaderFormat: this.dayHeaderFormat,
      slotDuration: this.slotDuration,
      slotLabelInterval: this.slotLabelInterval,
      slotLabelFormat: this.slotLabelFormat,
      timeZone: this.timeZone,
      slotMinTime: this.slotMinTime,
      slotMaxTime: this.slotMaxTime,
      scrollTime: this.scrollTime,
      firstDay: this.firstDay,
      initialDate: this.initialDate,
      navLinks: this.navLinks,
      weekNumbers: this.weekNumbers,
      weekNumberCalculation: this.weekNumberCalculation,
      weekText: this.weekText,
      nowIndicator: this.nowIndicator,
      businessHours: this.businessHours,
      noEventsContent: this.noEventsContent,
      eventTimeFormat: this.eventTimeFormat,
      moreLinkContent: this.moreLinkContent,
      moreLinkClick: this.moreLinkClick,
      selectable: this.selectable,
      selectMirror: this.selectMirror,
      selectOverlap: this.selectOverlap,
      selectConstraint: this.selectConstraint,
      dragScroll: this.dragScroll,
      dayPopoverFormat: this.dayPopoverFormat,
      views: {
        dayGridMonth: {
          dayHeaderFormat: this.dayHeaderFormatMonthView,
        },
      },
      select: this.onSelect.bind(this),
      datesSet: this.onDatesSet.bind(this),
      eventClick: this.onEventClick.bind(this),
      eventDidMount: this.onEventDidMount.bind(this),
      eventWillUnmount: this.onEventWillUnmount.bind(this),
      eventMouseEnter: this.onEventMouseEnter.bind(this),
      eventMouseLeave: this.onEventMouseLeave.bind(this),
    };
  }

  public onDatesSet(event: DatesSetArg): void {
    this.datesSet.emit(event);
  }

  public onSelect(range: DateSelectArg): void {
    this.selected.emit(range);
  }

  public onEventClick(event: EventClickArg): void {
    this.eventClicked.emit(event);
  }

  public onEventDidMount(event: MountArg<EventContentArg>): void {
    this.eventDidMount.emit(event);
  }

  public onEventWillUnmount(event: MountArg<EventContentArg>): void {
    this.eventWillUnmount.emit(event);
  }

  public onEventMouseEnter(event: EventHoveringArg): void {
    this.eventMouseEnter.emit(event);
  }

  public onEventMouseLeave(event: EventHoveringArg): void {
    this.eventMouseLeave.emit(event);
  }

  public getEvents(): EventApi[] {
    const api = this.calendar.getApi();
    return api.getEvents();
  }

  public removeAllEvents(): void {
    const api = this.calendar.getApi();
    return api.removeAllEvents();
  }

  public addEvent(event: EventInput): EventApi | null {
    const api = this.calendar.getApi();
    return api.addEvent(event);
  }

  public editEvent(event: EventInput): void {
    const events = this.getEvents();
    events.forEach(e => {
      if (e.id === event.id) {
        e.setProp('title', event.title!);
        e.setStart(event.start!);
        e.setEnd(event.end!);
      }
    });
  }

  public removeEvent(event: EventInput): void {
    const events = this.getEvents();
    events.forEach(e => {
      if (e.id === event.id) {
        e.remove();
      }
    });
  }

  public render(): void {
    const api = this.calendar.getApi();
    return api.render();
  }
}
