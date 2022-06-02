import { InjectionToken } from '@angular/core';
import type { BehaviorSubject } from 'rxjs';

export const HEADER_TOP_OFFSET = new InjectionToken<BehaviorSubject<number | null>>('HEADER_TOP_OFFSET');
