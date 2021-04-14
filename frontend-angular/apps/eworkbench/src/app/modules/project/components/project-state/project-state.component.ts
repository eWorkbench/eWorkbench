/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: 'eworkbench-project-state',
  templateUrl: './project-state.component.html',
  styleUrls: ['./project-state.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectStateComponent {
  @Input()
  public state?: string;

  @Input()
  public label = true;

  public constructor(private readonly translocoService: TranslocoService) {}
}
