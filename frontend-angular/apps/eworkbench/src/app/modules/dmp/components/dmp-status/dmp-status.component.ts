/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: 'eworkbench-dmp-status',
  templateUrl: './dmp-status.component.html',
  styleUrls: ['./dmp-status.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DMPStatusComponent {
  @Input()
  public status?: string;

  @Input()
  public label = true;
}
