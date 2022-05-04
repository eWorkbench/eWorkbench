/**
 * Copyright (C) 2016-2020 TU Muenchen and contributors of ANEXIA Internetdienstleistungs GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, ChangeDetectionStrategy } from '@angular/core';
import type { User } from '@eworkbench/types';
import { DialogRef } from '@ngneat/dialog';

@Component({
  selector: 'eworkbench-users-list-modal',
  templateUrl: './users-list.component.html',
  styleUrls: ['./users-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsersListModalComponent {
  public users: User[] = this.modalRef.data.users;

  public constructor(public readonly modalRef: DialogRef) {}
}
