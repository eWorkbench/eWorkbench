/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type { HttpParams } from '@angular/common/http';
import type { Observable } from 'rxjs';
import type { ExportLink } from './export-link.interface';

export interface ExportService {
  export: (id: string, params?: HttpParams) => Observable<ExportLink>;
}
