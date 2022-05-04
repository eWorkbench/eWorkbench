/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: 'eworkbench-resource-type',
  templateUrl: './resource-type.component.html',
  styleUrls: ['./resource-type.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResourceTypeComponent {
  @Input()
  public type?: string;

  @Input()
  public label = true;
}
