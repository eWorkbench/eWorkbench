/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Injectable } from '@angular/core';
import { Store, StoreConfig } from '@datorama/akita';

export interface CMSSettingsMaintenance {
  text: string | null;
  visible: boolean;
}

export interface CMSSettings {
  maintenance: CMSSettingsMaintenance;
}

export function createInitialState(): CMSSettings {
  return {
    maintenance: {
      text: null,
      visible: true,
    },
  };
}

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'cms' })
export class CMSStore extends Store<CMSSettings> {
  public constructor() {
    super(createInitialState());
  }
}
