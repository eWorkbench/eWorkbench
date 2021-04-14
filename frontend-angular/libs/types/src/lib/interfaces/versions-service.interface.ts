/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Version, FinalizeVersion } from './version.interface';

export interface VersionsService<T> {
  versions(id: string, params?: HttpParams): Observable<Version[]>;
  previewVersion(id: string, version: string): Observable<any>;
  addVersion(id: string, version?: FinalizeVersion): Observable<T>;
  restoreVersion(id: string, version: string, versionInProgress: boolean): Observable<T>;
}
