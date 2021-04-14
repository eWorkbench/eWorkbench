/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { CustomButtonInput } from '@fullcalendar/angular';

export interface CalendarDayHeaderFormat {
  weekday?: 'short' | 'long';
  month?: 'numeric' | '2-digit';
  day?: 'numeric' | '2-digit';
  omitCommas?: boolean;
}

export interface CalendarSlotLabelInterval {
  hours?: number;
  minutes?: number;
}

export interface CalendarDateFormat {
  year?: 'numeric' | '2-digit';
  month?: 'long' | 'short' | 'narrow' | 'numeric' | '2-digit';
  day?: 'numeric' | '2-digit';
  weekday?: 'long' | 'short' | 'narrow';
  hour?: 'numeric' | '2-digit';
  minute?: 'numeric' | '2-digit';
  second?: 'numeric' | '2-digit';
  hour12?: boolean;
  timeZoneName?: 'short';
  week?: 'short' | 'narrow' | 'numeric';
  meridiem?: 'lowercase' | 'short' | 'narrow' | false;
  omitZeroMinute?: boolean;
  omitCommas?: boolean;
}

export interface CalendarTimeFormat {
  hour?: 'numeric' | '2-digit';
  minute?: 'numeric' | '2-digit';
  second?: 'numeric' | '2-digit';
  hour12?: boolean;
  meridiem?: 'lowercase' | 'short' | 'narrow' | false;
  omitZeroMinute?: boolean;
}

export interface CalendarDayPopoverFormat {
  year?: 'numeric' | '2-digit';
  month?: 'long' | 'short' | 'narrow' | 'numeric' | '2-digit';
  day?: 'numeric' | '2-digit';
}

export interface CalendarCustomButtons {
  [name: string]: CustomButtonInput;
}

export interface CalendarEvent {
  id?: string;
  title?: string;
  start?: string | null;
  end?: string | null;
  fullDay?: boolean;
  url?: string;
  deleted?: boolean;
}
