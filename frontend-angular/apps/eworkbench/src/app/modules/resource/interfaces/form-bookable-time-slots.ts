import type { FormBookableTimeSlot } from './form-bookable-time-slot';

export interface FormBookableTimeSlots {
  monday: FormBookableTimeSlot;
  tuesday: FormBookableTimeSlot;
  wednesday: FormBookableTimeSlot;
  thursday: FormBookableTimeSlot;
  friday: FormBookableTimeSlot;
  saturday: FormBookableTimeSlot;
  sunday: FormBookableTimeSlot;
}
