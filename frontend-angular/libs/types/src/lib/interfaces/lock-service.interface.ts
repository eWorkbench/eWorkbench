/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type { HttpParams } from '@angular/common/http';
import type { Observable } from 'rxjs';

export interface LockService {
  lock: (id: string, params?: HttpParams) => Observable<void>;
  unlock: (id: string, params?: HttpParams) => Observable<void>;
}
