/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectionStrategy, Component } from '@angular/core';
import type { PluginDetails, User } from '@eworkbench/types';
import { DialogRef } from '@ngneat/dialog';
import { UntilDestroy } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: 'eworkbench-plugin-details-modal',
  templateUrl: './details.component.html',
  styleUrls: ['./details.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PluginDetailsModalComponent {
  public plugin: PluginDetails = this.modalRef.data.plugin;

  public showFeedbackFormForPlugin?: { type: string; id: string; responsibleUsers: User[] };

  public constructor(public readonly modalRef: DialogRef) {}

  public onSelected(event: { type: string; id: string; responsibleUsers: User[] }): void {
    this.showFeedbackFormForPlugin = { ...event };
  }

  public onHideFeedbackForm(): void {
    this.showFeedbackFormForPlugin = undefined!;
  }
}
