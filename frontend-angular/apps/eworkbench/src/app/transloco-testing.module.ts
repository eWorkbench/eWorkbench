/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type { ModuleWithProviders } from '@angular/core';
import en from '@assets/i18n/en.json';
import { TranslocoTestingModule, TranslocoConfig } from '@ngneat/transloco';

export function getTranslocoModule(config: Partial<TranslocoConfig> = {}): ModuleWithProviders<TranslocoTestingModule> {
  return TranslocoTestingModule.forRoot({
    langs: { en },
    translocoConfig: {
      availableLangs: ['en'],
      defaultLang: 'en',
      reRenderOnLangChange: true,
      ...config,
    },
  });
}
