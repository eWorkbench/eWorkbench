/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export interface DatePickerConfig {
  dateFormat?: string;
  defaultDate?: string;
  defaultHour?: number;
  defaultMinute?: number;
  enableTime?: boolean;
  hourIncrement?: number;
  minuteIncrement?: number;
  noCalendar?: boolean;
  locale?: any;
  time_24hr?: boolean;
}
