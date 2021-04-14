/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, Input, OnInit } from '@angular/core';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: 'eworkbench-form-asterisk',
  templateUrl: './form-asterisk.component.html',
  styleUrls: ['./form-asterisk.component.scss'],
})
export class FormAsteriskComponent implements OnInit {
  @Input()
  public tooltipText?: string;

  public constructor(private readonly translocoService: TranslocoService) {}

  public ngOnInit(): void {
    if (!this.tooltipText) {
      this.translocoService
        .selectTranslate('form.mandatoryField')
        .pipe(untilDestroyed(this))
        .subscribe(text => {
          this.tooltipText = text;
        });
    }
  }
}
