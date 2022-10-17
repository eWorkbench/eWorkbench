import { InjectionToken } from '@angular/core';
import type { BehaviorSubject } from 'rxjs';

export const SHOW_MENU = new InjectionToken<BehaviorSubject<boolean>>('SHOW_MENU');
