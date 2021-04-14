/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Injectable } from '@angular/core';
import { Query } from '@datorama/akita';
import { CMSSettings, CMSStore } from '../stores/cms.store';

@Injectable({ providedIn: 'root' })
export class CMSQuery extends Query<CMSSettings> {
  public cms$ = this.select(state => state);

  public constructor(protected store: CMSStore) {
    super(store);
  }
}
