/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import type { UserGroup } from '@eworkbench/types';
import { UntilDestroy } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: 'eworkbench-resource-usage-setting',
  templateUrl: './resource-usage-setting.component.html',
  styleUrls: ['./resource-usage-setting.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResourceUsageSettingComponent {
  @Input()
  public usageSetting?: string;

  @Input()
  public userGroups?: UserGroup[];

  @Input()
  public showNullValueString = false;

  @Input()
  public label = true;
}
