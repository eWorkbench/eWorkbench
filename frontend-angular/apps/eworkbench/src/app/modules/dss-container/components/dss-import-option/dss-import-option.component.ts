/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: 'eworkbench-dss-import-option',
  templateUrl: './dss-import-option.component.html',
  styleUrls: ['./dss-import-option.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DssImportOptionComponent {
  @Input()
  public importOption?: string;

  @Input()
  public label = true;
}
