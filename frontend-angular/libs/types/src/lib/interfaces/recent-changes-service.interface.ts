/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RecentChanges } from './recent-changes.interface';

export interface RecentChangesService {
  history(id: string, params?: HttpParams): Observable<RecentChanges[]>;
}
