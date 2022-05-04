/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import type { PluginDetails } from '@eworkbench/types';
import { UntilDestroy } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: 'eworkbench-plugin-details',
  templateUrl: './details.component.html',
  styleUrls: ['./details.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PluginDetailsComponent {
  @Input()
  public plugin!: PluginDetails;

  @Output()
  public dropdownSelected = new EventEmitter<{ type: string; id: string }>();

  public onDropdownSelected(event: { type: string; id: string }): void {
    this.dropdownSelected.emit(event);
  }
}
