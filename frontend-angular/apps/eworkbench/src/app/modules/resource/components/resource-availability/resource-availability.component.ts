/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { TranslocoService } from '@ngneat/transloco';
import { UntilDestroy } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: 'eworkbench-resource-availability',
  templateUrl: './resource-availability.component.html',
  styleUrls: ['./resource-availability.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResourceAvailabilityComponent {
  @Input()
  public availability?: string;

  @Input()
  public label = true;

  public constructor(private readonly translocoService: TranslocoService) {}
}
