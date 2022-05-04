/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type { AbstractControl, ValidatorFn } from '@angular/forms';

export function EmailDetected(): ValidatorFn {
  return (control: AbstractControl) => {
    if (control.value?.includes('@')) {
      return { emaildetected: true };
    }

    return null;
  };
}
