/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, ChangeDetectionStrategy } from '@angular/core';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: 'eworkbench-trash-notice',
  templateUrl: './notice.component.html',
  styleUrls: ['./notice.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrashNoticeComponent {
  public constructor(public readonly translocoService: TranslocoService) {}
}
