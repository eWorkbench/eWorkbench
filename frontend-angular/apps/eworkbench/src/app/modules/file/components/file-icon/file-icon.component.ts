/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: 'eworkbench-file-icon',
  templateUrl: './file-icon.component.html',
  styleUrls: ['./file-icon.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FileIconComponent {
  @Input()
  public mime!: string;

  public constructor(private readonly translocoService: TranslocoService) {}
}
