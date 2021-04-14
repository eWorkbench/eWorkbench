/* istanbul ignore file */

/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { TranslocoTestingModule, TranslocoConfig } from '@ngneat/transloco';
import en from '@assets/i18n/en.json';
import { ModuleWithProviders } from '@angular/core';

export function getTranslocoModule(config: Partial<TranslocoConfig> = {}): ModuleWithProviders<TranslocoTestingModule> {
  return TranslocoTestingModule.withLangs(
    { en },
    {
      availableLangs: ['en'],
      defaultLang: 'en',
      reRenderOnLangChange: true,
      ...config,
    }
  );
}
