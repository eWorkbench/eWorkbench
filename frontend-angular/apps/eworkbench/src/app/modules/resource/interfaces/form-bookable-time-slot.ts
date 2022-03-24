export interface FormBookableTimeSlot {
  id?: string;
  checked: boolean;
  weekday: string;
  weekdayTranslationKey: string;
  fullDay: boolean;
  timeStart: string | null;
  timeEnd: string | null;
  invalidTimeSelection: boolean;
}
