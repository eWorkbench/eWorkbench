/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { PluginDetails } from '@eworkbench/types';
import { UntilDestroy } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: 'eworkbench-plugin-small-preview',
  templateUrl: './small-preview.component.html',
  styleUrls: ['./small-preview.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PluginSmallPreviewComponent {
  @Input()
  public plugin?: PluginDetails;
}
