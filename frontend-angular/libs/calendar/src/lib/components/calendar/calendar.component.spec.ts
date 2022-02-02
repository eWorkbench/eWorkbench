/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {
  BusinessHoursInput,
  ButtonIconsInput,
  ButtonTextCompoundInput,
  DatesSetArg,
  FormatterInput,
  FullCalendarModule,
} from '@fullcalendar/angular';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import Chance from 'chance';
import { PopoverModule } from 'ngx-bootstrap/popover';
import {
  CalendarCustomButtons,
  CalendarDateFormat,
  CalendarDayHeaderFormat,
  CalendarDayPopoverFormat,
  CalendarSlotInterval,
  CalendarTimeFormat,
} from '../../interfaces/calendar.interfaces';
import { CalendarComponent } from './calendar.component';

const startDate = new Date();
const endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000); // 24 hours difference in milliseconds

const event: DatesSetArg = {
  id: '485948ee-a688-4fec-a2af-942e05c70268',
  end: endDate,
  endStr: endDate.toISOString(),
  start: startDate,
  startStr: startDate.toISOString(),
  timeZone: 'local',
  // @ts-ignore
  view: {
    calendar: {} as any,
    getCurrentData: {},
    getOption: () => {},
    title: 'July 2020',
    dateEnv: {
      calendarSystem: {},
      canComputeOffset: true,
      cmdFormatter: null,
      defaultSeparator: ' - ',
      locale: {
        codeArg: 'en-US',
        codes: ['en-US'],
        options: {
          allDayText: 'all-day',
          buttonText: {
            day: 'day',
            list: 'list',
            month: 'month',
            next: 'next',
            nextYear: 'next year',
            prev: 'prev',
            prevYear: 'prev year',
            today: 'today',
            week: 'week',
            year: 'year',
          },
          direction: 'ltr',
          moreLinkText: 'more',
          noEventsText: 'No events to display',
          weekText: 'W',
        },
        simpleNumberFormat: {},
        week: { dow: 0, doy: 4 },
      },
      timeZone: 'local',
      weekDow: 1,
      weekDoy: 4,
      weekText: 'W',
    },
    type: 'dayGridMonth',
    activeEnd: endDate,
    activeStart: startDate,
    currentEnd: endDate,
    currentStart: startDate,
  },
};

describe('CalendarComponent', () => {
  let spectator: Spectator<CalendarComponent>;
  let chance: Chance.Chance;
  let expectedString: string;
  const createComponent = createComponentFactory({
    component: CalendarComponent,
    imports: [FullCalendarModule, PopoverModule.forRoot()],
  });

  beforeEach(() => (spectator = createComponent()));

  beforeEach(() => {
    chance = new Chance();
    expectedString = chance.string({ alpha: true, symbols: false });
  });

  it('should create', () => {
    expect(spectator).toBeTruthy();
  });

  it('should call onDatesSet()', () => {
    const onDatesSetSpy = jest.spyOn(spectator.component, 'onDatesSet');
    spectator.component.onDatesSet(event as unknown as Event);
    expect(onDatesSetSpy).toHaveBeenCalledTimes(1);
  });

  it('should call onSelect()', () => {
    const onSelectSpy = jest.spyOn(spectator.component, 'onSelect');
    const dateStart = new Date(2020, 0, 15, 9, 0, 0, 0);
    const dateEnd = new Date(2020, 0, 15, 15, 0, 0, 0);
    const expected = {
      start: dateStart,
      end: dateEnd,
      startStr: dateStart.toString(),
      endStr: dateEnd.toString(),
      allDay: false,
      jsEvent: null,
      view: event.view,
    };
    spectator.component.onSelect(expected as unknown as Event);
    expect(onSelectSpy).toHaveBeenCalledWith(expected);
    expect(onSelectSpy).toHaveBeenCalledTimes(1);
  });

  it('should call onEventClick()', () => {
    const onEventClickSpy = jest.spyOn(spectator.component, 'onEventClick');
    spectator.component.onEventClick({} as any);
    expect(onEventClickSpy).toHaveBeenCalledTimes(1);
  });

  it('should call getEvents()', () => {
    const getEventsSpy = jest.spyOn(spectator.component, 'getEvents');
    spectator.component.getEvents();
    expect(getEventsSpy).toHaveBeenCalledTimes(1);
  });

  it('should call removeAllEvents()', () => {
    const removeAllEventsSpy = jest.spyOn(spectator.component, 'removeAllEvents');
    spectator.component.removeAllEvents();
    expect(removeAllEventsSpy).toHaveBeenCalledTimes(1);
  });

  it('should call addEvent()', () => {
    const addEventSpy = jest.spyOn(spectator.component, 'addEvent');
    spectator.component.addEvent({});
    expect(addEventSpy).toHaveBeenCalledWith({});
    expect(addEventSpy).toHaveBeenCalledTimes(1);
  });

  it('should call editEvent()', () => {
    const editEventSpy = jest.spyOn(spectator.component, 'editEvent');
    spectator.component.addEvent(event);
    spectator.component.addEvent({ ...event, id: '704566f1-e73a-4f90-ad1d-36f4d8a58be9' });
    spectator.component.editEvent(event);
    expect(editEventSpy).toHaveBeenCalledTimes(1);
  });

  it('should call removeEvent()', () => {
    const removeEventSpy = jest.spyOn(spectator.component, 'removeEvent');
    spectator.component.addEvent(event);
    spectator.component.addEvent({ ...event, id: '704566f1-e73a-4f90-ad1d-36f4d8a58be9' });
    spectator.component.removeEvent(event);
    expect(removeEventSpy).toHaveBeenCalledTimes(1);
  });

  it('should set the locale', () => {
    const expectedValue = 'de-DE';
    spectator.setInput({
      locale: expectedValue,
    });
    expect(spectator.component.locale).toBe(expectedValue);
  });

  it('should set the theme system', () => {
    const expectedValue = 'standard';
    spectator.setInput({
      themeSystem: expectedValue,
    });
    expect(spectator.component.themeSystem).toBe(expectedValue);
  });

  it('should set the height', () => {
    const expectedValue = 200;
    spectator.setInput({
      height: expectedValue,
    });
    expect(spectator.component.height).toBe(expectedValue);
  });

  it('should set the content height', () => {
    const expectedValue = 200;
    spectator.setInput({
      contentHeight: expectedValue,
    });
    expect(spectator.component.contentHeight).toBe(expectedValue);
  });

  it('should set the aspect ratio', () => {
    const expectedValue = 1.5;
    spectator.setInput({
      aspectRatio: expectedValue,
    });
    expect(spectator.component.aspectRatio).toBe(expectedValue);
  });

  it(`should set the initial view to 'dayGridWeek'`, () => {
    const expectedValue = 'dayGridWeek';
    spectator.setInput({
      initialView: expectedValue,
    });
    expect(spectator.component.initialView).toBe(expectedValue);
  });

  it(`should set the initial view to 'timeGridWeek'`, () => {
    const expectedValue = 'timeGridWeek';
    spectator.setInput({
      initialView: expectedValue,
    });
    expect(spectator.component.initialView).toBe(expectedValue);
  });

  it(`should set the initial view to 'listWeek'`, () => {
    const expectedValue = 'listWeek';
    spectator.setInput({
      initialView: expectedValue,
    });
    expect(spectator.component.initialView).toBe(expectedValue);
  });

  it(`should set the initial view to 'dayGridMonth'`, () => {
    const expectedValue = 'dayGridMonth';
    spectator.setInput({
      initialView: expectedValue,
    });
    expect(spectator.component.initialView).toBe(expectedValue);
  });

  it('should show weekends', () => {
    const expectedValue = true;
    spectator.setInput({
      weekends: expectedValue,
    });
    expect(spectator.component.weekends).toBe(expectedValue);
  });

  it('should hide weekends', () => {
    const expectedValue = false;
    spectator.setInput({
      weekends: expectedValue,
    });
    expect(spectator.component.weekends).toBe(expectedValue);
  });

  it('should set hidden days', () => {
    const expectedValue = [1, 2, 5];
    spectator.setInput({
      hiddenDays: expectedValue,
    });
    expect(spectator.component.hiddenDays).toBe(expectedValue);
  });

  it('should show day headers', () => {
    const expectedValue = true;
    spectator.setInput({
      dayHeaders: expectedValue,
    });
    expect(spectator.component.dayHeaders).toBe(expectedValue);
  });

  it('should set headerToolbar options', () => {
    const expectedValue = {
      left: 'title',
      center: '',
      right: 'today prev,next',
    };
    spectator.setInput({
      headerToolbar: expectedValue,
    });
    expect(spectator.component.headerToolbar).toBe(expectedValue);
  });

  it('should disable headerToolbar', () => {
    const expectedValue = false;
    spectator.setInput({
      headerToolbar: expectedValue,
    });
    expect(spectator.component.headerToolbar).toBe(expectedValue);
  });

  it('should show all day slot', () => {
    const expectedValue = true;
    spectator.setInput({
      allDaySlot: expectedValue,
    });
    expect(spectator.component.allDaySlot).toBe(expectedValue);
  });

  it('should hide all day slot', () => {
    const expectedValue = false;
    spectator.setInput({
      allDaySlot: expectedValue,
    });
    expect(spectator.component.allDaySlot).toBe(expectedValue);
  });

  it('should set all day text', () => {
    const expectedValue = 'all-day';
    spectator.setInput({
      allDayContent: expectedValue,
    });
    expect(spectator.component.allDayContent).toBe(expectedValue);
  });

  it('should enable event overlap', () => {
    const expectedValue = true;
    spectator.setInput({
      slotEventOverlap: expectedValue,
    });
    expect(spectator.component.slotEventOverlap).toBe(expectedValue);
  });

  it('should disable event overlap', () => {
    const expectedValue = false;
    spectator.setInput({
      slotEventOverlap: expectedValue,
    });
    expect(spectator.component.slotEventOverlap).toBe(expectedValue);
  });

  it('should set maximum day events', () => {
    const expectedValue = 4;
    spectator.setInput({
      dayMaxEvents: expectedValue,
    });
    expect(spectator.component.dayMaxEvents).toBe(expectedValue);
  });

  it('should disable maximum day events', () => {
    const expectedValue = false;
    spectator.setInput({
      dayMaxEvents: expectedValue,
    });
    expect(spectator.component.dayMaxEvents).toBe(expectedValue);
  });

  it('should set the display format for events', () => {
    const expectedValue = 'list-item';
    spectator.setInput({
      eventDisplay: expectedValue,
    });
    expect(spectator.component.eventDisplay).toBe(expectedValue);
  });

  it('should set list day format with object configuration', () => {
    const expectedValue: CalendarDateFormat = {
      weekday: 'long',
    };
    spectator.setInput({
      listDayFormat: expectedValue,
    });
    expect(spectator.component.listDayFormat).toBe(expectedValue);
  });

  it('should hide day in calendar list', () => {
    const expectedValue = false;
    spectator.setInput({
      listDayFormat: expectedValue,
    });
    expect(spectator.component.listDayFormat).toBe(expectedValue);
  });

  it('should set alternate list day format with object configuration', () => {
    const expectedValue: CalendarDateFormat = {
      month: 'long',
      day: '2-digit',
      year: 'numeric',
    };
    spectator.setInput({
      listDaySideFormat: expectedValue,
    });
    expect(spectator.component.listDaySideFormat).toBe(expectedValue);
  });

  it('should hide alternate day in calendar list', () => {
    const expectedValue = false;
    spectator.setInput({
      listDaySideFormat: expectedValue,
    });
    expect(spectator.component.listDaySideFormat).toBe(expectedValue);
  });

  it('should set footerToolbar options', () => {
    const expectedValue = {
      left: 'title',
      center: '',
      right: 'today prev,next',
    };
    spectator.setInput({
      footerToolbar: expectedValue,
    });
    expect(spectator.component.footerToolbar).toBe(expectedValue);
  });

  it('should disable footerToolbar', () => {
    const expectedValue = false;
    spectator.setInput({
      footerToolbar: expectedValue,
    });
    expect(spectator.component.footerToolbar).toBe(expectedValue);
  });

  it('should set title format', () => {
    const expectedValue: FormatterInput = {
      year: 'numeric',
      month: 'long',
    };
    spectator.setInput({
      titleFormat: expectedValue,
    });
    expect(spectator.component.titleFormat).toBe(expectedValue);
  });

  it('should set title range separator', () => {
    const expectedValue = ' \u2013 ';
    spectator.setInput({
      titleRangeSeparator: expectedValue,
    });
    expect(spectator.component.titleRangeSeparator).toBe(expectedValue);
  });

  it('should set button text configuration', () => {
    const expectedValue: ButtonTextCompoundInput = {
      today: 'today',
      month: 'month',
      week: 'week',
      day: 'day',
      list: 'list',
    };
    spectator.setInput({
      buttonText: expectedValue,
    });
    expect(spectator.component.buttonText).toBe(expectedValue);
  });

  it('should set button icons configuration', () => {
    const expectedValue: ButtonIconsInput = {
      prev: 'left-single-arrow',
      next: 'right-single-arrow',
      prevYear: 'left-double-arrow',
      nextYear: 'right-double-arrow',
    };
    spectator.setInput({
      buttonIcons: expectedValue,
    });
    expect(spectator.component.buttonIcons).toBe(expectedValue);
  });

  it('should set custom buttons', () => {
    const expectedValue: CalendarCustomButtons = {
      myCustomButton: {
        text: expectedString,
        click: () => {},
        icon: 'left-single-arrow',
      },
    };
    spectator.setInput({
      customButtons: expectedValue,
    });
    expect(spectator.component.customButtons).toBe(expectedValue);
  });

  it('should hide day headers', () => {
    const expectedValue = false;
    spectator.setInput({
      dayHeaders: expectedValue,
    });
    expect(spectator.component.dayHeaders).toBe(expectedValue);
  });

  it('should set custom day header format', () => {
    const expectedValue: CalendarDayHeaderFormat = {
      weekday: 'short',
      month: 'numeric',
      day: 'numeric',
      omitCommas: true,
    };
    spectator.setInput({
      dayHeaderFormat: expectedValue,
    });
    expect(spectator.component.dayHeaderFormat).toBe(expectedValue);
  });

  it('should set custom day header format for month view', () => {
    const expectedValue: CalendarDayHeaderFormat = { weekday: 'short' };
    spectator.setInput({
      dayHeaderFormatMonthView: expectedValue,
    });
    expect(spectator.component.dayHeaderFormatMonthView).toBe(expectedValue);
  });

  it('should set slot duration with string configuration', () => {
    const expectedValue = '00:15:00';
    spectator.setInput({
      slotDuration: expectedValue,
    });
    expect(spectator.component.slotDuration).toBe(expectedValue);
  });

  it('should set slot duration with object configuration', () => {
    const expectedValue: CalendarSlotInterval = { hours: 0, minutes: 15 };
    spectator.setInput({
      slotDuration: expectedValue,
    });
    expect(spectator.component.slotDuration).toBe(expectedValue);
  });

  it('should set slot label interval with string configuration', () => {
    const expectedValue = '01:00';
    spectator.setInput({
      slotLabelInterval: expectedValue,
    });
    expect(spectator.component.slotLabelInterval).toBe(expectedValue);
  });

  it('should set slot label interval with object configuration', () => {
    const expectedValue: CalendarSlotInterval = { hours: 1, minutes: 30 };
    spectator.setInput({
      slotLabelInterval: expectedValue,
    });
    expect(spectator.component.slotLabelInterval).toBe(expectedValue);
  });

  it('should set slot label format', () => {
    const expectedValue: CalendarDateFormat = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'narrow',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
      timeZoneName: 'short',
      week: 'narrow',
      meridiem: false,
      omitZeroMinute: true,
      omitCommas: false,
    };
    spectator.setInput({
      slotLabelFormat: expectedValue,
    });
    expect(spectator.component.slotLabelFormat).toBe(expectedValue);
  });

  it('should set the time zone', () => {
    const expectedValue = 'UTC';
    spectator.setInput({
      timeZone: expectedValue,
    });
    expect(spectator.component.timeZone).toBe(expectedValue);
  });

  it('should set the minimum time', () => {
    const expectedValue = '08:00:00';
    spectator.setInput({
      slotMinTime: expectedValue,
    });
    expect(spectator.component.slotMinTime).toBe(expectedValue);
  });

  it('should set the maximum time', () => {
    const expectedValue = '22:00:00';
    spectator.setInput({
      slotMaxTime: expectedValue,
    });
    expect(spectator.component.slotMaxTime).toBe(expectedValue);
  });

  it('should set the scroll time', () => {
    const expectedValue = '08:00:00';
    spectator.setInput({
      slotMaxTime: expectedValue,
    });
    expect(spectator.component.scrollTime).toBe(expectedValue);
  });

  it('should show non-current dates', () => {
    const expectedValue = true;
    spectator.setInput({
      showNonCurrentDates: expectedValue,
    });
    expect(spectator.component.showNonCurrentDates).toBe(expectedValue);
  });

  it('should hide non-current dates', () => {
    const expectedValue = false;
    spectator.setInput({
      showNonCurrentDates: expectedValue,
    });
    expect(spectator.component.showNonCurrentDates).toBe(expectedValue);
  });

  it('should enable fixed week count', () => {
    const expectedValue = true;
    spectator.setInput({
      fixedWeekCount: expectedValue,
    });
    expect(spectator.component.fixedWeekCount).toBe(expectedValue);
  });

  it('should disable fixed week count', () => {
    const expectedValue = false;
    spectator.setInput({
      fixedWeekCount: expectedValue,
    });
    expect(spectator.component.fixedWeekCount).toBe(expectedValue);
  });

  it('should set first day of week', () => {
    const expectedValue = 0;
    spectator.setInput({
      firstDay: expectedValue,
    });
    expect(spectator.component.firstDay).toBe(expectedValue);
  });

  it('should set the initial date', () => {
    const expectedValue = '2020-01-01';
    spectator.setInput({
      initialDate: expectedValue,
    });
    expect(spectator.component.initialDate).toBe(expectedValue);
  });

  it('should enable navigation links', () => {
    const expectedValue = true;
    spectator.setInput({
      navLinks: expectedValue,
    });
    expect(spectator.component.navLinks).toBe(expectedValue);
  });

  it('should disable navigation links', () => {
    const expectedValue = false;
    spectator.setInput({
      navLinks: expectedValue,
    });
    expect(spectator.component.navLinks).toBe(expectedValue);
  });

  it('should enable week number', () => {
    const expectedValue = true;
    spectator.setInput({
      weekNumbers: expectedValue,
    });
    expect(spectator.component.weekNumbers).toBe(expectedValue);
  });

  it('should disable week numbers', () => {
    const expectedValue = false;
    spectator.setInput({
      weekNumbers: expectedValue,
    });
    expect(spectator.component.weekNumbers).toBe(expectedValue);
  });

  it('should set week number calculation', () => {
    const expectedValue = 'local';
    spectator.setInput({
      weekNumberCalculation: expectedValue,
    });
    expect(spectator.component.weekNumberCalculation).toBe(expectedValue);
  });

  it('should set week number text', () => {
    const expectedValue = 'W';
    spectator.setInput({
      weekText: expectedValue,
    });
    expect(spectator.component.weekText).toBe(expectedValue);
  });

  it('should enable now indicator', () => {
    const expectedValue = true;
    spectator.setInput({
      nowIndicator: expectedValue,
    });
    expect(spectator.component.nowIndicator).toBe(expectedValue);
  });

  it('should disable now indicator', () => {
    const expectedValue = false;
    spectator.setInput({
      nowIndicator: expectedValue,
    });
    expect(spectator.component.nowIndicator).toBe(expectedValue);
  });

  it('should set business hours as object configuration', () => {
    const expectedValue: BusinessHoursInput = {
      daysOfWeek: [1, 2, 3, 4],
      startTime: '10:00',
      endTime: '18:00',
    };
    spectator.setInput({
      businessHours: expectedValue,
    });
    expect(spectator.component.businessHours).toBe(expectedValue);
  });

  it('should set business hours as list configuration', () => {
    const expectedValue: BusinessHoursInput[] = [
      {
        daysOfWeek: [1, 2, 3],
        startTime: '08:00',
        endTime: '18:00',
      },
      {
        daysOfWeek: [4, 5],
        startTime: '10:00',
        endTime: '16:00',
      },
    ];
    spectator.setInput({
      businessHours: expectedValue,
    });
    expect(spectator.component.businessHours).toBe(expectedValue);
  });

  it('should disable business hours configuration', () => {
    const expectedValue = false;
    spectator.setInput({
      businessHours: expectedValue,
    });
    expect(spectator.component.businessHours).toBe(expectedValue);
  });

  it('should set events', () => {
    const events = [
      { title: expectedString, date: '2020-04-15' },
      { title: expectedString, date: '2020-04-16' },
    ];
    events.forEach(event => {
      spectator.component.addEvent(event);
    });
    spectator.detectChanges();
    expect(spectator.component.getEvents().length).toBe(events.length);
  });

  it('should set the message when no events are set', () => {
    const expectedValue = expectedString;
    spectator.setInput({
      noEventsContent: expectedValue,
    });
    expect(spectator.component.noEventsContent).toBe(expectedValue);
  });

  it('should set event time format', () => {
    const expectedValue: CalendarTimeFormat = {
      hour: 'numeric',
      minute: '2-digit',
      meridiem: 'short',
    };
    spectator.setInput({
      eventTimeFormat: expectedValue,
    });
    expect(spectator.component.eventTimeFormat).toBe(expectedValue);
  });

  it('should set event link text', () => {
    const expectedValue = 'more';
    spectator.setInput({
      moreLinkContent: expectedValue,
    });
    expect(spectator.component.moreLinkContent).toBe(expectedValue);
  });

  it('should set event link click behavior', () => {
    const expectedValue = 'week';
    spectator.setInput({
      moreLinkClick: expectedValue,
    });
    expect(spectator.component.moreLinkClick).toBe(expectedValue);
  });

  it('should activate selectable dates', () => {
    const expectedValue = true;
    spectator.setInput({
      selectable: expectedValue,
    });
    expect(spectator.component.selectable).toBe(expectedValue);
  });

  it('should deactivate selectable dates', () => {
    const expectedValue = false;
    spectator.setInput({
      selectable: expectedValue,
    });
    expect(spectator.component.selectable).toBe(expectedValue);
  });

  it('should activate select mirror', () => {
    const expectedValue = true;
    spectator.setInput({
      selectMirror: expectedValue,
    });
    expect(spectator.component.selectMirror).toBe(expectedValue);
  });

  it('should deactivate select mirror', () => {
    const expectedValue = false;
    spectator.setInput({
      selectMirror: expectedValue,
    });
    expect(spectator.component.selectMirror).toBe(expectedValue);
  });

  it('should activate select overlap', () => {
    const expectedValue = true;
    spectator.setInput({
      selectOverlap: expectedValue,
    });
    expect(spectator.component.selectOverlap).toBe(expectedValue);
  });

  it('should deactivate select overlap', () => {
    const expectedValue = false;
    spectator.setInput({
      selectOverlap: expectedValue,
    });
    expect(spectator.component.selectOverlap).toBe(expectedValue);
  });

  it('should set select constraint', () => {
    const expectedValue = 'my-id';
    spectator.setInput({
      selectConstraint: expectedValue,
    });
    expect(spectator.component.selectConstraint).toBe(expectedValue);
  });

  it('should activate drag scroll', () => {
    const expectedValue = true;
    spectator.setInput({
      dragScroll: expectedValue,
    });
    expect(spectator.component.dragScroll).toBe(expectedValue);
  });

  it('should deactivate drag scroll', () => {
    const expectedValue = false;
    spectator.setInput({
      dragScroll: expectedValue,
    });
    expect(spectator.component.dragScroll).toBe(expectedValue);
  });

  it('should set day popover format', () => {
    const expectedValue: CalendarDayPopoverFormat = {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    };
    spectator.setInput({
      dayPopoverFormat: expectedValue,
    });
    expect(spectator.component.dayPopoverFormat).toBe(expectedValue);
  });

  it('should activate deep change detection', () => {
    const expectedValue = true;
    spectator.setInput({
      deepChangeDetection: expectedValue,
    });
    expect(spectator.component.deepChangeDetection).toBe(expectedValue);
  });

  it('should deactivate deep change detection', () => {
    const expectedValue = false;
    spectator.setInput({
      deepChangeDetection: expectedValue,
    });
    expect(spectator.component.deepChangeDetection).toBe(expectedValue);
  });
});
