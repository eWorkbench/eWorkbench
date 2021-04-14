# calendar

## Implementation

The calendar selector can then be used in any template to implement this component after its module has been imported.

```ts
import { CalendarModule } from '@eworkbench/calendar';
```

```html
<eworkbench-calendar></eworkbench-calendar>
```

Possible values to configure via data binding:

```ts
@Input()
public locale: LocaleSingularArg = 'en-US';

@Input()
public themeSystem?: string;

@Input()
public height: string | number = 'auto';

@Input()
public contentHeight: string | number = 'auto';

@Input()
public aspectRatio: number = 1.35;

@Input()
public initialView: 'dayGridWeek' | 'timeGridWeek' | 'listWeek' | 'dayGridMonth' = 'timeGridWeek';

@Input()
public weekends: boolean = true;

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
public slotEventOverlap: boolean = true;

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
public titleFormat: FormatterInput = { year: 'numeric', month: 'long' };

@Input()
public titleRangeSeparator?: string;

@Input()
public buttonText?: ButtonTextCompoundInput;

@Input()
public buttonIcons?: ButtonIconsInput | false;

@Input()
public customButtons?: { [name: string]: CustomButtonInput };

@Input()
public dayHeaders: boolean = true;

@Input()
public dayHeaderFormat: CalendarDayHeaderFormat = {
  weekday: 'short',
  month: 'numeric',
  day: 'numeric',
  omitCommas: true,
};

@Input()
public slotDuration = '00:30:00';

@Input()
public slotLabelInterval: string | CalendarSlotLabelInterval = '01:00';

@Input()
public slotLabelFormat: CalendarDateFormat = {
  hour: 'numeric',
  minute: '2-digit',
  omitZeroMinute: true,
  meridiem: 'lowercase',
};

@Input()
public timeZone: string = 'local';

@Input()
public slotMinTime = '06:00:00';

@Input()
public slotMaxTime = '22:00:00';

@Input()
public scrollTime = '08:00:00';

@Input()
public showNonCurrentDates = true;

@Input()
public fixedWeekCount = false;

@Input()
public firstDay: number = 1;

@Input()
public initialDate?: string;

@Input()
public navLinks: boolean = false;

@Input()
public weekNumbers = true;

@Input()
public weekNumberCalculation: 'local' | 'ISO' | ((m: Date) => number) = 'ISO';

@Input()
public weekText?: string;

@Input()
public nowIndicator: boolean = true;

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
public selectable: boolean = true;

@Input()
public selectMirror: boolean = true;

@Input()
public selectOverlap: boolean | OverlapFunc = true;

@Input()
public selectConstraint?: ConstraintInput;

@Input()
public dragScroll: boolean = true;

@Input()
public dayPopoverFormat: CalendarDayPopoverFormat = {
  month: 'long',
  day: 'numeric',
  year: 'numeric',
};

@Input()
public deepChangeDetection = false;
```

## Running unit tests

Run `npx nx test calendar` to execute the unit tests.
