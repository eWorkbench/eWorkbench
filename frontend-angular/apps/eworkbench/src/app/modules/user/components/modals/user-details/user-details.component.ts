/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, ChangeDetectionStrategy } from '@angular/core';
import type { User } from '@eworkbench/types';
import { DialogRef } from '@ngneat/dialog';

@Component({
  selector: 'eworkbench-user-details-modal',
  templateUrl: './user-details.component.html',
  styleUrls: ['./user-details.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserDetailsModalComponent {
  public user: User = this.modalRef.data.user;

  public constructor(public readonly modalRef: DialogRef) {}
}
