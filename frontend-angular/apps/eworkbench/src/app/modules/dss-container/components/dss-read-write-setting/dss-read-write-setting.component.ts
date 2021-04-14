/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: 'eworkbench-dss-read-write-setting',
  templateUrl: './dss-read-write-setting.component.html',
  styleUrls: ['./dss-read-write-setting.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DssReadWriteSettingComponent {
  @Input()
  public readWriteSetting?: string;

  @Input()
  public label = true;
}
