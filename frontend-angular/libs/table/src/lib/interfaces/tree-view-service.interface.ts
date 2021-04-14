/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface TreeViewService {
  getList(params?: HttpParams): Observable<{ total: number; data: any[] }>;
  getChildrenOf(childrenOf: string, params: HttpParams): Observable<{ total: number; data: any[] }>;
}
