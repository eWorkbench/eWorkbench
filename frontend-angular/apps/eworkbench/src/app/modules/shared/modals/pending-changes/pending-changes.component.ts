/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DialogRef } from '@ngneat/dialog';

@Component({
  selector: 'eworkbench-pending-changes-modal',
  templateUrl: './pending-changes.component.html',
  styleUrls: ['./pending-changes.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PendingChangesModalComponent {
  public constructor(public readonly modalRef: DialogRef) {}
}
