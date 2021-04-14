/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { FormGroup } from '@angular/forms';

export function MustMatch(controlName: string, matchingControlName: string) {
  return (formGroup: FormGroup) => {
    const control = formGroup.controls[controlName];
    const matchingControl = formGroup.controls[matchingControlName];

    if (matchingControl.errors && !matchingControl.errors.mustmatch) {
      return;
    }

    /* istanbul ignore next */
    if (control.value !== matchingControl.value) {
      matchingControl.setErrors({ mustmatch: true });
      return;
    }

    matchingControl.setErrors(null);
  };
}
